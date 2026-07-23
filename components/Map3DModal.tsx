import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import Map3DView so MapLibre only ships to clients that
// actually open the modal.
const Map3DView = dynamic(() => import("./Map3DView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-elevated">
      <p className="font-terminal text-sm text-text-muted animate-pulse">
        $ loading 3D engine...
      </p>
    </div>
  ),
});

interface Map3DModalProps {
  open: boolean;
  onClose: () => void;
  lat: number | null | undefined;
  lng: number | null | undefined;
  caseId?: string;
  title?: string;
  type?: string;
}

/**
 * Full-screen modal that hosts the Map3DView. Keeps the 3D engine
 * completely isolated from the underlying 2D map — the modal only mounts
 * MapLibre when `open` is true, and unmounts it when closed to free GPU
 * memory.
 */
export default function Map3DModal({
  open,
  onClose,
  lat,
  lng,
  caseId,
  title,
  type,
}: Map3DModalProps) {
  const [windowHeight, setWindowHeight] = useState(0);

  // Close on Escape and prevent body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handler);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setWindowHeight(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!open || typeof lat !== "number" || typeof lng !== "number") return null;

  const height = windowHeight ? Math.round(windowHeight * 0.9) - 48 : 520;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-bg/85 backdrop-blur-sm p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        // Click on the backdrop closes the modal; clicks inside the map
        // area should not bubble here.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-6xl h-full max-h-[90vh] flex flex-col rounded-md border border-borderStrong bg-elevated shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-elevated2/80 px-4 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-terminal text-xs tracking-widest text-accent">
              $ 3D_view
            </span>
            {caseId && (
              <span className="font-terminal text-[11px] text-text-faint">
                {caseId}
              </span>
            )}
            {title && (
              <span className="hidden sm:inline font-code text-xs text-text-muted truncate max-w-[400px]">
                — {title}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            title="বন্ধ করুন (Esc)"
            className="rounded-md border border-border px-2.5 py-1 font-terminal text-xs text-text-muted hover:text-danger hover:border-danger/40 transition-colors"
          >
            ✕ বন্ধ
          </button>
        </div>

        {/* 3D map fills the remaining space */}
        <div className="flex-1 min-h-0">
          <Map3DView
            lat={lat}
            lng={lng}
            caseId={caseId}
            title={title}
            type={type}
            height={height}
            className="!rounded-none !border-0"
          />
        </div>

        {/* Footer with contextual help */}
        <div className="border-t border-border bg-elevated2/60 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <p className="font-terminal text-[10px] text-text-faint">
            $ ড্র্যাগ করে সরান · Ctrl+ড্র্যাগ করে ঘোরান · স্ক্রল করে জুম
          </p>
          <p className="font-terminal text-[10px] text-text-faint">
            data © OpenStreetMap · tiles © OpenFreeMap
          </p>
        </div>
      </div>
    </div>
  );
}
