"use client";

import { useRef, useState, useEffect, useCallback } from "react";

type Tool = "brush" | "eraser" | "fill" | "line" | "rect" | "circle";

interface PaintCanvasProps {
  onSave: (data: string) => void;
  initialData?: string | null;
  isSaving?: boolean;
}

const COLORS = [
  "#000000", "#808080", "#800000", "#808000",
  "#008000", "#008080", "#000080", "#800080",
  "#ffffff", "#c0c0c0", "#ff0000", "#ffff00",
  "#00ff00", "#00ffff", "#0000ff", "#ff00ff",
  "#ff8000", "#00ff80", "#8000ff", "#ff0080",
];

const SIZES = [2, 4, 8, 12, 20];

export function PaintCanvas({ onSave, initialData, isSaving }: PaintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement!;
      const rect = container.getBoundingClientRect();
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(canvas, 0, 0);

      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
    };

    if (initialData) {
      const img = new Image();
      img.onload = () => {
        const container = canvas.parentElement!;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialData;
    } else {
      resizeCanvas();
    }

    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [initialData]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const floodFill = useCallback(
    (startX: number, startY: number, fillColor: string) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const hex = fillColor.replace("#", "");
      const fr = parseInt(hex.substring(0, 2), 16);
      const fg = parseInt(hex.substring(2, 4), 16);
      const fb = parseInt(hex.substring(4, 6), 16);

      const sx = Math.floor(startX);
      const sy = Math.floor(startY);
      const startIdx = (sy * canvas.width + sx) * 4;
      const sr = data[startIdx];
      const sg = data[startIdx + 1];
      const sb = data[startIdx + 2];

      if (sr === fr && sg === fg && sb === fb) return;

      const stack = [[sx, sy]];
      const visited = new Set<number>();

      while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        const idx = (y * canvas.width + x) * 4;

        if (
          x < 0 || x >= canvas.width || y < 0 || y >= canvas.height ||
          visited.has(idx)
        ) continue;

        if (
          Math.abs(data[idx] - sr) > 30 ||
          Math.abs(data[idx + 1] - sg) > 30 ||
          Math.abs(data[idx + 2] - sb) > 30
        ) continue;

        visited.add(idx);
        data[idx] = fr;
        data[idx + 1] = fg;
        data[idx + 2] = fb;
        data[idx + 3] = 255;

        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }

      ctx.putImageData(imageData, 0, 0);
    },
    []
  );

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);

    if (tool === "fill") {
      floodFill(pos.x, pos.y, color);
      return;
    }

    setIsDrawing(true);
    lastPos.current = pos;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (tool === "brush" || tool === "eraser") {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.fill();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !lastPos.current) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);

    if (tool === "brush" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      lastPos.current = pos;
    } else if (snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = "round";

      const start = lastPos.current;
      if (tool === "line") {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tool === "rect") {
        ctx.strokeRect(start.x, start.y, pos.x - start.x, pos.y - start.y);
      } else if (tool === "circle") {
        const rx = Math.abs(pos.x - start.x) / 2;
        const ry = Math.abs(pos.y - start.y) / 2;
        const cx = start.x + (pos.x - start.x) / 2;
        const cy = start.y + (pos.y - start.y) / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const endDraw = () => {
    setIsDrawing(false);
    lastPos.current = null;
    snapshotRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current!;
    onSave(canvas.toDataURL("image/png"));
  };

  const tools: { id: Tool; label: string; icon: string }[] = [
    { id: "brush", label: "Brush", icon: "🖌" },
    { id: "eraser", label: "Eraser", icon: "◻" },
    { id: "fill", label: "Fill", icon: "🪣" },
    { id: "line", label: "Line", icon: "╱" },
    { id: "rect", label: "Rectangle", icon: "▭" },
    { id: "circle", label: "Circle", icon: "○" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-neutral-100 border-b border-neutral-300 shrink-0">
        {/* Tools */}
        <div className="flex gap-0.5 border-r border-neutral-300 pr-2">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`w-9 h-9 flex items-center justify-center text-sm rounded transition-colors cursor-pointer ${
                tool === t.id
                  ? "bg-blue-500 text-white"
                  : "hover:bg-neutral-200"
              }`}
              title={t.label}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* Colors */}
        <div className="flex flex-wrap gap-0.5 border-r border-neutral-300 pr-2 max-w-60">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-sm border cursor-pointer ${
                color === c ? "border-blue-500 border-2" : "border-neutral-400"
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        {/* Custom color */}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 cursor-pointer border-0 p-0"
          title="Custom color"
        />

        {/* Size */}
        <div className="flex gap-0.5 items-center border-r border-neutral-300 pr-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer ${
                size === s ? "bg-blue-500" : "hover:bg-neutral-200"
              }`}
              title={`${s}px`}
            >
              <span
                className="rounded-full bg-black"
                style={{
                  width: Math.min(s, 16),
                  height: Math.min(s, 16),
                  ...(size === s && { backgroundColor: "white" }),
                }}
              />
            </button>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={clearCanvas}
          className="px-3 h-8 text-sm bg-neutral-200 hover:bg-neutral-300 rounded cursor-pointer transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 h-8 text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 rounded cursor-pointer transition-colors"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden bg-neutral-200 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
    </div>
  );
}
