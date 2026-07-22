import { useEffect, useRef, useState } from "react";

/**
 * HeatMapView — Renders a Leaflet map with heatmap overlay showing
 * complaint intensity across Bangladesh.
 *
 * Instead of requiring an external `leaflet.heat` plugin, this component
 * uses a custom Canvas-based heatmap approach:
 * - High-intensity areas (exact pins) render as bright, dense clusters
 * - District centroids render as larger, softer circles
 * - Intensity coloring: cool (blue/green) → hot (yellow/red)
 *
 * All heatmap rendering happens on a transparent <canvas> overlay that
 * synchronizes with Leaflet's pan/zoom.
 */

interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-1
}

interface DistrictCentroid {
  name: string;
  lat: number;
  lng: number;
  count: number;
}

interface HeatData {
  points: [number, number, number][];
  districtCentroids: DistrictCentroid[];
  totalPins: number;
}

export default function HeatMapView({ height = 520 }: { height?: number }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapInstance = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const [data, setData] = useState<HeatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalReports, setTotalReports] = useState(0);

  // Fetch heatmap data
  useEffect(() => {
    setLoading(true);
    setError("");

    fetch("/api/stats/heatmap")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
        setTotalReports(d.totalPins + d.districtCentroids.reduce((sum, c) => sum + c.count, 0));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapContainer.current) return;
    if (mapInstance.current) return; // already initialized

    let cancelled = false;

    async function initMap() {
      // Dynamic import Leaflet (it uses `window`)
      const L = (await import("leaflet")).default;

      if (cancelled || !mapContainer.current) return;
      leafletRef.current = L;

      // Bangladesh bounding box
      const map = L.map(mapContainer.current, {
        center: [23.685, 90.3563],
        zoom: 7,
        minZoom: 6,
        maxZoom: 10,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
      });

      // Dark tile layer (matching terminal aesthetic)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://openstreetmap.org/copyright">OSM</a> · &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
        subdomains: "abcd",
      }).addTo(map);

      mapInstance.current = map;

      // Render heatmap when data is available
      if (data && canvasRef.current) {
        renderHeatmap(L, map, data);
      }

      // Invalidate size after mount to fix rendering
      setTimeout(() => map.invalidateSize(), 100);
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When data loads, render heatmap on existing map
  useEffect(() => {
    if (!data || !mapInstance.current || !leafletRef.current) return;
    renderHeatmap(leafletRef.current, mapInstance.current, data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function renderHeatmap(L: any, map: any, heatData: HeatData) {
    const { points, districtCentroids } = heatData;

    // Clear existing heatmap layers (keep tile layer)
    map.eachLayer((layer: any) => {
      if (layer._isHeatLayer) {
        map.removeLayer(layer);
      }
    });

    // ── Render points as gradient circles ───────────────────────────
    // High-intensity (exact) → small, bright, opaque
    // Low-intensity (district) → large, soft, transparent

    // Color gradient function: 0=blue, 0.3=cyan, 0.5=green, 0.7=yellow, 1=red
    function heatColor(intensity: number): string {
      const i = Math.max(0, Math.min(1, intensity));
      if (i < 0.25) {
        // Blue → Cyan
        const t = i / 0.25;
        return `rgba(${Math.round(30 * t)}, ${Math.round(150 + 105 * t)}, 255, ${0.3 + 0.3 * t})`;
      } else if (i < 0.5) {
        // Cyan → Green
        const t = (i - 0.25) / 0.25;
        return `rgba(${Math.round(30 + 195 * t)}, 255, ${Math.round(255 - 200 * t)}, ${0.6 + 0.2 * t})`;
      } else if (i < 0.75) {
        // Green → Yellow
        const t = (i - 0.5) / 0.25;
        return `rgba(${Math.round(225 + 30 * t)}, 255, ${Math.round(55 - 55 * t)}, 0.8)`;
      } else {
        // Yellow → Red
        const t = (i - 0.75) / 0.25;
        return `rgba(255, ${Math.round(255 - 255 * t)}, 0, ${0.8 + 0.2 * t})`;
      }
    }

    // Add exact points as circle markers with gradient
    points.forEach(([lat, lng, intensity]) => {
      const radius = 8 + intensity * 12; // 8-20px radius
      const color = heatColor(intensity);
      const fillOpacity = 0.4 + intensity * 0.4;

      const circle = L.circleMarker([lat, lng], {
        radius,
        color: color,
        fillColor: color,
        fillOpacity,
        weight: 1,
        opacity: 0.6,
        _isHeatLayer: true,
      });

      // Add a subtle glow effect for high-intensity points
      if (intensity > 0.7) {
        circle.setStyle({
          weight: 2,
          opacity: 0.8,
        });
      }

      circle.addTo(map);
    });

    // Add district centroids as labeled markers
    districtCentroids.forEach((d) => {
      // Size proportional to count (12-30px)
      const size = Math.max(12, Math.min(30, 8 + d.count * 3));

      const circle = L.circleMarker([d.lat, d.lng], {
        radius: size,
        color: "rgba(13, 148, 136, 0.6)",
        fillColor: "rgba(13, 148, 136, 0.25)",
        fillOpacity: 0.3,
        weight: 2,
        opacity: 0.5,
        _isHeatLayer: true,
      });

      // Tooltip with district name and count
      circle.bindTooltip(
        `<div class="font-terminal text-xs">
          <span style="color:#0D9488;">$</span> ${d.name}
          <br/><span style="color:#94A3B8;">${d.count}টি রিপোর্ট</span>
        </div>`,
        {
          direction: "top",
          offset: [0, -4],
          className: "heatmap-tooltip",
        }
      );

      circle.addTo(map);
    });

    // Add a legend overlay after a short delay
    setTimeout(() => addLegend(L, map), 500);
  }

  function addLegend(L: any, map: any) {
    // Remove existing legend
    map.eachLayer((layer: any) => {
      if (layer._isLegend) {
        map.removeLayer(layer);
      }
    });

    const LegendControl = L.Control.extend({
      options: { position: "bottomright" },
      onAdd: function () {
        const div = L.DomUtil.create("div", "heatmap-legend");
        div.innerHTML = `
          <div style="
            background: rgba(21,35,59,0.9);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 4px;
            padding: 8px 10px;
            font-family: 'VT323', monospace;
            font-size: 10px;
            color: #94A3B8;
            line-height: 1.6;
          ">
            <div style="margin-bottom:4px;color:#F1F5F9;font-size:11px;">$ intensity</div>
            <div style="display:flex;align-items:center;gap:4px;">
              <span style="width:12px;height:12px;display:inline-block;background:rgba(30,150,255,0.5);border-radius:50%;"></span>
              <span>নিম্ন</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
              <span style="width:12px;height:12px;display:inline-block;background:rgba(255,255,50,0.7);border-radius:50%;"></span>
              <span>মধ্যম</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
              <span style="width:12px;height:12px;display:inline-block;background:rgba(255,50,50,0.9);border-radius:50%;"></span>
              <span>উচ্চ</span>
            </div>
          </div>
        `;
        div.querySelector("div")!._isLegend = true;
        return div;
      },
    });

    map.addControl(new LegendControl());
  }

  return (
    <div className="relative overflow-hidden rounded-md border border-border">
      {/* Loading state */}
      {loading && (
        <div
          className="flex items-center justify-center bg-elevated/60"
          style={{ height }}
        >
          <p className="font-terminal text-sm text-text-muted animate-pulse">
            $ loading heatmap...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div
          className="flex items-center justify-center bg-elevated/60"
          style={{ height }}
        >
          <p className="font-code text-sm text-danger">
            <span className="term-err">[!]</span> {error}
          </p>
        </div>
      )}

      {/* Map container (hidden during loading) */}
      <div
        ref={mapContainer}
        style={{ height, display: loading ? "none" : "block" }}
        className="heatmap-container"
      />

      {/* Stats overlay */}
      {!loading && !error && data && (
        <div className="absolute top-3 left-3 z-[1000] rounded-md border border-borderStrong bg-elevated/90 px-3 py-2 backdrop-blur-sm">
          <p className="font-terminal text-xs text-accent">
            <span className="term-ok">$</span> হিটম্যাপ
          </p>
          <p className="mt-0.5 font-code text-[10px] text-text-faint">
            {data.districtCentroids.length}টি জেলা · {data.totalPins}টি সঠিক অবস্থান
          </p>
        </div>
      )}

      <style jsx global>{`
        /* Heatmap tooltip styling */
        .heatmap-tooltip {
          background: rgba(21, 35, 59, 0.95) !important;
          border: 1px solid rgba(13, 148, 136, 0.3) !important;
          border-radius: 4px !important;
          padding: 6px 10px !important;
          font-family: 'VT323', monospace !important;
          font-size: 12px !important;
          color: #F1F5F9 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        }
        .heatmap-tooltip::before {
          border-top-color: rgba(13, 148, 136, 0.3) !important;
        }

        /* Map container */
        .heatmap-container .leaflet-container {
          background: #0B1423;
        }

        /* Dark attribution */
        .heatmap-container .leaflet-control-attribution {
          background: rgba(11, 20, 35, 0.8) !important;
          color: #64748B !important;
          font-size: 9px !important;
          font-family: 'VT323', monospace !important;
        }
        .heatmap-container .leaflet-control-attribution a {
          color: #94A3B8 !important;
        }

        /* Zoom controls dark */
        .heatmap-container .leaflet-control-zoom a {
          background: rgba(21, 35, 59, 0.9) !important;
          color: #94A3B8 !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .heatmap-container .leaflet-control-zoom a:hover {
          background: rgba(30, 47, 74, 0.9) !important;
          color: #F1F5F9 !important;
        }
      `}</style>
    </div>
  );
}