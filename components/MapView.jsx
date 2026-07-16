import { useEffect, useRef, useState } from "react";

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = "&copy; <a href='https://openstreetmap.org/copyright'>OpenStreetMap</a>";

export default function MapView({ items = [], className = "" }) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markerLayer = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMap = async () => {
      try {
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");

        if (!mapContainer.current || mapInstance.current) return;

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        const map = L.map(mapContainer.current, {
          center: [23.685, 90.3563],
          zoom: 7,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer(TILE_URL, {
          attribution: ATTRIBUTION,
          maxZoom: 18,
        }).addTo(map);

        markerLayer.current = L.layerGroup().addTo(map);
        mapInstance.current = map;
        setLoaded(true);
      } catch (e) {
        console.error("Map load error:", e);
        setError("মানচিত্র লোড করা যায়নি");
      }
    };

    loadMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!loaded || !mapInstance.current || !markerLayer.current) return;

    markerLayer.current.clearLayers();

    if (!items || items.length === 0) return;

    const L = window.L;
    const bounds = [];
    const bangladeshBounds = L.latLngBounds([20.5, 88.0], [26.7, 92.7]);

    items.forEach((item) => {
      if (!item.lat || !item.lng) return;

      const marker = L.marker([item.lat, item.lng], {
        title: item.title || item.caseId,
      });

      marker.bindPopup(`
        <div style="font-family: 'Space Grotesk', system-ui, sans-serif; min-width: 220px; background: #0A0E15; color: #E1E4E8; border: 1px solid rgba(232,163,61,0.3);">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.06);padding:12px;">
            <span style="font-family:'VT323',monospace;font-size:12px;color:#E8A33D;">${item.caseId || ""}</span>
            <span style="font-family:'VT323',monospace;font-size:10px;color:#505A6B;">$$ PID</span>
          </div>
          <div style="padding:12px;">
            <p style="font-size:14px;font-weight:600;margin:0 0 6px;color:#E1E4E8;">${item.title || ""}</p>
            ${item.summary ? `<p style="font-size:12px;color:#7D8899;margin:0 0 8px;border-left:2px solid #E8A33D;padding-left:8px;">${item.summary.substring(0, 120)}...</p>` : ""}
            <div style="display:flex;justify-content:space-between;font-family:'VT323',monospace;font-size:11px;color:#505A6B;border-top:1px solid rgba(255,255,255,0.06);padding-top:8px;margin-top:4px;">
              <span>${item.type === "incident" ? "অপরাধ" : "অভিযোগ"}</span>
              <span style="color:#E8A33D;">${item.location ? item.location.split(",").slice(0, 2).join(", ") : ""}</span>
            </div>
          </div>
        </div>
      `);

      markerLayer.current.addLayer(marker);

      if (bangladeshBounds.contains([item.lat, item.lng])) {
        bounds.push([item.lat, item.lng]);
      }
    });

    if (bounds.length > 0) {
      mapInstance.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    }
  }, [items, loaded]);

  if (error) {
    return (
      <div className={`rounded-none border border-danger/40 bg-danger-soft p-6 text-center ${className}`}>
        <p className="font-code text-sm text-danger"><span className="term-err">[!]</span> {error}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-none overflow-hidden border border-border ${className}`}>
      <div ref={mapContainer} className="h-[400px] w-full" style={{ background: "#10171F" }} />
      {!loaded && (
        <div className="h-[400px] flex items-center justify-center bg-elevated">
          <p className="font-terminal text-sm text-amber animate-pulse">$ loading map...</p>
        </div>
      )}
    </div>
  );
}