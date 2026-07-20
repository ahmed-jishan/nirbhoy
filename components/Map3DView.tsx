import { useEffect, useRef, useState } from "react";

// OpenFreeMap tile styles — Liberty has 3D buildings baked into its vector
// tiles. Positron / Bright are flatter fallbacks if the user prefers a
// cleaner view.
const STYLES = {
  liberty: {
    url: "https://tiles.openfreemap.org/styles/liberty",
    label: "Liberty (3D)",
    supports3D: true,
  },
  positron: {
    url: "https://tiles.openfreemap.org/styles/positron",
    label: "Positron",
    supports3D: false,
  },
  bright: {
    url: "https://tiles.openfreemap.org/styles/bright",
    label: "Bright",
    supports3D: false,
  },
};

type StyleKey = keyof typeof STYLES;

interface Map3DViewProps {
  lat: number;
  lng: number;
  caseId?: string;
  title?: string;
  type?: string;
  height?: number;
  className?: string;
  onClose?: () => void;
}

/**
 * A separate 3D map view built on MapLibre GL JS + OpenFreeMap vector
 * tiles. Kept isolated from the primary Leaflet-based MapView so the
 * existing 2D flow is unaffected — users toggle into this view only when
 * they want to inspect a location's built environment more closely.
 *
 * Controls:
 *   - Pitch / bearing to tilt into 3D
 *   - Style switcher (Liberty / Positron / Bright)
 *   - Reset pitch (return to top-down)
 *   - Optional close callback (used inside modal wrapper)
 */
export default function Map3DView({
  lat,
  lng,
  caseId,
  title,
  type = "incident",
  height = 520,
  className = "",
  onClose,
}: Map3DViewProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [currentStyle, setCurrentStyle] = useState<StyleKey>("liberty");
  const [pitch, setPitch] = useState(60);

  // Initial mount — set up MapLibre with pitch enabled so 3D buildings show
  // up right away. maplibre-gl uses `window`, so this component must be
  // dynamically imported by the parent (ssr: false).
  useEffect(() => {
    let cancelled = false;
    const setup = async () => {
      try {
        const maplibregl: any = (await import("maplibre-gl")).default;
        await import("maplibre-gl/dist/maplibre-gl.css");
        if (cancelled || !container.current) return;

        const map = new maplibregl.Map({
          container: container.current,
          style: STYLES[currentStyle].url,
          center: [lng, lat],
          zoom: 17,
          pitch: 60,
          bearing: -20,
          antialias: true,
          maxPitch: 85,
        });

        // Compact navigation controls (zoom, compass, pitch reset).
        map.addControl(
          new maplibregl.NavigationControl({
            visualizePitch: true,
            showCompass: true,
            showZoom: true,
          }),
          "top-left"
        );

        // Once the style is fully loaded, ensure 3D buildings are visible
        // on styles that support them. Liberty already contains a
        // 3d-building layer, but if a downstream style omits it we inject
        // a minimal extrusion layer as a fallback.
        map.on("load", () => {
          try {
            ensure3DBuildings(map);
          } catch {
            /* ignore fallback failures */
          }
          if (!cancelled) setLoaded(true);
        });

        // Add a striking pin at the reported location. We render a custom
        // HTML element so the marker matches the terminal aesthetic used
        // elsewhere in Nirbhoy.
        const el = document.createElement("div");
        el.className = "nirbhoy-3d-marker";
        el.innerHTML = markerSvg(type, caseId);
        el.style.transform = "translate(-50%, -100%)";

        new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([lng, lat])
          .addTo(map);

        // Optional popup with the case ID / title.
        if (caseId || title) {
          new maplibregl.Popup({
            offset: 44,
            closeButton: false,
            className: "nirbhoy-3d-popup",
          })
            .setLngLat([lng, lat])
            .setHTML(
              `<div style="font-family:'Space Grotesk',system-ui;padding:6px 10px;background:#0B1121;color:#F1F5F9;border:1px solid rgba(13,148,136,0.3);">
                ${caseId ? `<div style="font-family:'VT323',monospace;font-size:12px;color:#14B8A6;">${caseId}</div>` : ""}
                ${title ? `<div style="font-size:13px;font-weight:600;margin-top:2px;">${escapeHtml(title)}</div>` : ""}
              </div>`
            )
            .addTo(map);
        }

        map.on("pitch", () => {
          setPitch(Math.round(map.getPitch()));
        });

        mapRef.current = map;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Map3DView load error:", e);
        setError("৩ডি মানচিত্র লোড করা যায়নি");
      }
    };
    setup();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the vector style when the user picks a different basemap. We
  // preserve camera position so the transition feels seamless.
  useEffect(() => {
    if (!mapRef.current) return;
    const camera = {
      center: mapRef.current.getCenter(),
      zoom: mapRef.current.getZoom(),
      pitch: mapRef.current.getPitch(),
      bearing: mapRef.current.getBearing(),
    };
    mapRef.current.setStyle(STYLES[currentStyle].url);
    mapRef.current.once("style.load", () => {
      try {
        ensure3DBuildings(mapRef.current);
      } catch {
        /* noop */
      }
      mapRef.current.jumpTo(camera);
    });
  }, [currentStyle]);

  function resetPitch() {
    if (!mapRef.current) return;
    mapRef.current.easeTo({ pitch: 0, bearing: 0, duration: 800 });
  }

  function tiltMax() {
    if (!mapRef.current) return;
    mapRef.current.easeTo({ pitch: 70, bearing: -25, duration: 800 });
  }

  if (error) {
    return (
      <div
        className={`rounded-md border border-danger/40 bg-danger-soft p-6 text-center ${className}`}
        style={{ height }}
      >
        <p className="font-code text-sm text-danger">
          <span className="term-err">[!]</span> {error}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-md overflow-hidden border border-border relative bg-elevated ${className}`}
      style={{ height }}
    >
      <div ref={container} className="w-full h-full" style={{ background: "#0B1121" }} />

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-elevated pointer-events-none">
          <p className="font-terminal text-sm text-text-muted animate-pulse">
            $ initializing 3D view...
          </p>
        </div>
      )}

      {/* Style switcher — top-right */}
      {loaded && (
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
          <div className="flex rounded-md border border-border bg-elevated/95 backdrop-blur-sm shadow-lg overflow-hidden">
            {(Object.entries(STYLES) as [StyleKey, typeof STYLES[StyleKey]][]).map(
              ([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCurrentStyle(key)}
                  className={`px-2.5 py-1.5 font-terminal text-[11px] transition-colors ${
                    currentStyle === key
                      ? "bg-accent text-bg"
                      : "text-text-muted hover:text-text-primary hover:bg-elevated2"
                  }`}
                  title={cfg.label}
                >
                  {cfg.label}
                </button>
              )
            )}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={tiltMax}
              title="সর্বোচ্চ কোণ (3D)"
              className="rounded-md border border-border bg-elevated/95 px-2.5 py-1.5 font-terminal text-xs text-text-muted hover:text-accent hover:border-accent/40 backdrop-blur-sm shadow-lg transition-colors"
            >
              ⛰
            </button>
            <button
              type="button"
              onClick={resetPitch}
              title="উপর থেকে দেখুন"
              className="rounded-md border border-border bg-elevated/95 px-2.5 py-1.5 font-terminal text-xs text-text-muted hover:text-accent hover:border-accent/40 backdrop-blur-sm shadow-lg transition-colors"
            >
              ⌂
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="বন্ধ করুন"
                className="rounded-md border border-danger/40 bg-elevated/95 px-2.5 py-1.5 font-terminal text-xs text-danger hover:bg-danger hover:text-bg backdrop-blur-sm shadow-lg transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom-left: pitch indicator + attribution helper */}
      {loaded && (
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
          <div className="rounded-md border border-border bg-elevated/95 px-3 py-1.5 font-terminal text-[10px] text-text-muted backdrop-blur-sm shadow-lg">
            <span className="text-accent">3D</span> · pitch {pitch}° ·{" "}
            {STYLES[currentStyle].label}
          </div>
        </div>
      )}
    </div>
  );
}

// Injects a fill-extrusion layer if the current style has building geometry
// but no extrusion layer of its own. Silently no-ops if the source is
// missing (e.g. on Positron which lacks the building layer).
function ensure3DBuildings(map: any) {
  if (!map) return;
  const layers = map.getStyle().layers || [];
  const already = layers.some((l: any) => l.type === "fill-extrusion");
  if (already) return;

  // OpenFreeMap uses "openmaptiles" as the vector source with a "building"
  // source-layer. We insert the extrusion above the label layers so text
  // stays readable.
  const sources = map.getStyle().sources || {};
  if (!sources.openmaptiles) return;

  const labelLayer = layers.find(
    (l: any) => l.type === "symbol" && l.layout && l.layout["text-field"]
  );
  const beforeId = labelLayer ? labelLayer.id : undefined;

  map.addLayer(
    {
      id: "nirbhoy-3d-buildings",
      source: "openmaptiles",
      "source-layer": "building",
      type: "fill-extrusion",
      minzoom: 14,
      paint: {
        "fill-extrusion-color": "#2A3140",
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14,
          0,
          15.5,
          ["coalesce", ["get", "render_height"], ["get", "height"], 10],
        ],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
        "fill-extrusion-opacity": 0.85,
      },
    },
    beforeId
  );
}

// Marker SVG matching the 2D MapView's style so users get visual continuity
// when they toggle between the two views.
function markerSvg(type: string, caseId?: string) {
  const num = caseId ? String(caseId).split("-").pop() : "?";
  const isIncident = type === "incident";
  const bg = isIncident ? "#DC2626" : "#0D9488";
  const border = isIncident ? "#991B1B" : "#0F766E";
  const size = 48;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 ${size} ${size + 10}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="none" stroke="${bg}" stroke-width="1" opacity="0.4">
        <animate attributeName="r" from="${size / 2 - 4}" to="${size / 2 + 6}" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.5" to="0" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="${bg}" stroke="${border}" stroke-width="2"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 6}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
      <text x="${size / 2}" y="${size / 2 + 4}" text-anchor="middle" fill="#0B1121" font-family="'VT323',monospace" font-size="14" font-weight="bold">${num}</text>
      <path d="M${size / 2 - 5} ${size - 4} L${size / 2} ${size + 8} L${size / 2 + 5} ${size - 4} Z" fill="${bg}" stroke="${border}" stroke-width="1"/>
    </svg>`;
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
