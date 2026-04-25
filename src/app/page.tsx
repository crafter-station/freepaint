"use client";

import { useEffect, useState, useCallback } from "react";
import { PaintCanvas } from "@/components/paint-canvas";
import { Gallery } from "@/components/gallery";
import { getFingerprint } from "@/lib/fingerprint";
import { Painting } from "@/db/schema";

export default function Home() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [current, setCurrent] = useState<Painting | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showGallery, setShowGallery] = useState(true);

  useEffect(() => {
    getFingerprint().then(setFingerprint);
  }, []);

  const loadPaintings = useCallback(async () => {
    if (!fingerprint) return;
    const res = await fetch(`/api/paintings?fingerprint=${fingerprint}`);
    const data = await res.json();
    setPaintings(data);
  }, [fingerprint]);

  useEffect(() => {
    loadPaintings();
  }, [loadPaintings]);

  const handleSave = async (data: string) => {
    if (!fingerprint) return;
    setIsSaving(true);

    try {
      if (current) {
        await fetch("/api/paintings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: current.id,
            fingerprint,
            data,
          }),
        });
      } else {
        const name = prompt("Name your painting:", "Untitled") || "Untitled";
        const res = await fetch("/api/paintings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fingerprint, name, data }),
        });
        const saved = await res.json();
        setCurrent(saved);
      }
      await loadPaintings();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!fingerprint) return;
    await fetch("/api/paintings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, fingerprint }),
    });
    if (current?.id === id) setCurrent(null);
    await loadPaintings();
  };

  const handleNew = () => {
    setCurrent(null);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-neutral-300 shrink-0">
        <h1 className="text-lg font-bold tracking-tight">FreePaint</h1>
        <div className="flex items-center gap-2">
          {current && (
            <span className="text-sm text-neutral-500">{current.name}</span>
          )}
          <button
            onClick={() => setShowGallery(!showGallery)}
            className="px-3 py-1 text-sm bg-neutral-100 hover:bg-neutral-200 rounded cursor-pointer transition-colors"
          >
            {showGallery ? "Hide Gallery" : "My Paintings"}{" "}
            {paintings.length > 0 && `(${paintings.length})`}
          </button>
        </div>
      </header>

      {/* Gallery */}
      {showGallery && paintings.length > 0 && (
        <Gallery
          paintings={paintings}
          onSelect={(p) => setCurrent(p)}
          onDelete={handleDelete}
          onNew={handleNew}
        />
      )}

      {/* Canvas */}
      <div className="flex-1 min-h-0">
        <PaintCanvas
          key={current?.id || "new"}
          onSave={handleSave}
          initialData={current?.data}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
