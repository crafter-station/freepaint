"use client";

import { Painting } from "@/db/schema";

interface GalleryProps {
  paintings: Painting[];
  onSelect: (painting: Painting) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function Gallery({ paintings, onSelect, onDelete, onNew }: GalleryProps) {
  return (
    <div className="p-4 bg-neutral-50 border-b border-neutral-300">
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <button
          onClick={onNew}
          className="shrink-0 w-24 h-18 rounded border-2 border-dashed border-neutral-400 hover:border-blue-400 flex items-center justify-center text-neutral-500 hover:text-blue-500 transition-colors cursor-pointer text-2xl"
          title="New painting"
        >
          +
        </button>
        {paintings.map((p) => (
          <div key={p.id} className="shrink-0 group relative">
            <button
              onClick={() => onSelect(p)}
              className="w-24 h-18 rounded border border-neutral-300 overflow-hidden bg-white cursor-pointer hover:border-blue-400 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.data}
                alt={p.name}
                className="w-full h-full object-cover"
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(p.id);
              }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center cursor-pointer hover:bg-red-600"
              title="Delete"
            >
              ×
            </button>
            <p className="text-xs text-center text-neutral-600 mt-1 truncate w-24">
              {p.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
