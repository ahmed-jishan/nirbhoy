import { useEffect, useRef, useState } from "react";

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = "&copy; <a href='https://openstreetmap.org/copyright'>OpenStreetMap</a>";

// Zoom levels based on location precision — higher = more zoomed in
const PRECISION_ZOOM = {
  street: 18,
  thana: 15,
  district: 12,
  default: 7,
};

// Custom marker icon SVG as data URI
function createNumberedIcon(caseId, isActive = false) {
  const num = caseId ? caseId.split("-").pop() : "?";
  const bgColor = isActive ? "#7C8BA0" : "#8892A4";
  const borderColor = isActive ? "#94A4B8" : "#6B7A90";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>
      <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
      <text x="20" y="24" text-anchor="middle" fill="#0A0E15" font-family="'VT323',monospace" font-size="14" font-weight="bold">${num}</text>
      <circle cx="20" cy="38" r="4" fill="${bgColor}" stroke="${borderColor}" stroke-width="1"/>
    </svg>`;
  const encoded = encodeURIComponent(svg);
  return {
    iconUrl: `data:image/svg+xml,${encoded}`,
    iconSize: [40, 44],
    iconAnchor: [20, 44],
    popupAnchor: [0, -44],
    shadowUrl: "",
    shadowSize: [0, 0],
  };
}

export default function MapView({
  items = [],
  className = "",
  activeCaseId = null,
  onCaseSelect = null,
}) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markerLayer = useRef(null);
  const markersRef = useRef({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const initialFitDone = useRef(false);
  const flyTimeoutRef = useRef(null);

  // Load map
  useEffect(() => {
    const loadMap = async () => {
      try {
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");

        if (!mapContainer.current || mapInstance.current) return;

        delete L.Icon.Default.prototype._getIconUrl;

        const map = L.map(mapContainer.current, {
          center: [23.685, 90.3563],
          zoom: 7,
          zoomControl: true,
          attributionControl: true,
          maxZoom: 19,
          zoomSnap: 0.5,
          wheelPxPerZoomLevel: 120,
        });

        L.tileLayer(TILE_URL, {
          attribution: ATTRIBUTION,
          maxZoom: 19,
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
      if (flyTimeoutRef.current) clearTimeout(flyTimeoutRef.current);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update markers when items change
  useEffect(() => {
    if (!loaded || !mapInstance.current || !markerLayer.current) return;

    markerLayer.current.clearLayers();
    markersRef.current = {};

    if (!items || items.length === 0) return;

    const L = window.L;
    const bounds = [];
    const bangladeshBounds = L.latLngBounds([20.5, 88.0], [26.7, 92.7]);

    items.forEach((item) => {
      if (!item.lat || !item.lng) return;

      const icon = L.icon(createNumberedIcon(item.caseId, item.caseId === activeCaseId));

      const marker = L.marker([item.lat, item.lng], {
        icon,
        title: item.caseId,
        riseOnHover: true,
      });

      // Popup content
      marker.bindPopup(`
        <div style="font-family: 'Space Grotesk', system-ui, sans-serif; min-width: 220px; background: #0A0E15; color: #E1E4E8; border: 1px solid rgba(136,146,164,0.3);">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.06);padding:10px 12px;">
            <span style="font-family:'VT323',monospace;font-size:13px;color:#8892A4;">${item.caseId || ""}</span>
            <span style="font-family:'VT323',monospace;font-size:10px;color:#505A6B;">${
              item.locationPrecision === "street" ? "📍 রাস্তা" :
              item.locationPrecision === "thana" ? "📍 থানা" : "📍 জেলা"
            }</span>
          </div>
          <div style="padding:12px;">
            <p style="font-size:14px;font-weight:600;margin:0 0 6px;color:#E1E4E8;">${item.title || ""}</p>
            ${item.summary ? `<p style="font-size:12px;color:#7D8899;margin:0 0 8px;border-left:2px solid #8892A4;padding-left:8px;">${item.summary.substring(0, 120)}...</p>` : ""}
            <div style="display:flex;justify-content:space-between;font-family:'VT323',monospace;font-size:11px;color:#505A6B;border-top:1px solid rgba(255,255,255,0.06);padding-top:8px;margin-top:4px;">
              <span>${item.type === "incident" ? "অপরাধ" : "অভিযোগ"}</span>
              <span style="color:#8892A4;">${item.location ? item.location.split(",").slice(0, 2).join(", ") : ""}</span>
            </div>
          </div>
        </div>
      `);

      marker.on("popupopen", () => {
        if (onCaseSelect) onCaseSelect(item.caseId);
      });

      marker.on("click", () => {
        if (onCaseSelect) onCaseSelect(item.caseId);
      });

      markerLayer.current.addLayer(marker);
      markersRef.current[item.caseId] = marker;

      if (bangladeshBounds.contains([item.lat, item.lng])) {
        bounds.push([item.lat, item.lng]);
      }
    });

    // Fit bounds to show all markers — no maxZoom limit so user can zoom in later
    if (bounds.length > 0 && !initialFitDone.current) {
      mapInstance.current.fitBounds(bounds, { padding: [40, 40] });
      initialFitDone.current = true;
    }
  }, [items, loaded, activeCaseId, onCaseSelect]);

  // When activeCaseId changes, fly to that marker with precision zoom
  useEffect(() => {
    if (!loaded || !mapInstance.current || !activeCaseId) return;

    const marker = markersRef.current[activeCaseId];
    if (!marker) return;

    const item = items.find((i) => i.caseId === activeCaseId);
    if (!item) return;

    // Determine zoom level based on precision
    const precision = item.locationPrecision || "district";
    const zoom = PRECISION_ZOOM[precision] || PRECISION_ZOOM.district;

    // Clear any previous fly timeout
    if (flyTimeoutRef.current) clearTimeout(flyTimeoutRef.current);

    // Fly to the marker with appropriate zoom
    mapInstance.current.flyTo(marker.getLatLng(), zoom, {
      duration: 1.5,
      easeLinearity: 0.3,
    });

    // Open popup after fly completes
    flyTimeoutRef.current = setTimeout(() => {
      marker.openPopup();
    }, 1600);
  }, [activeCaseId, loaded, items]);

  if (error) {
    return (
      <div className={`rounded-none border border-danger/40 bg-danger-soft p-6 text-center ${className}`}>
        <p className="font-code text-sm text-danger"><span className="term-err">[!]</span> {error}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-none overflow-hidden border border-border relative ${className}`}>
      <div ref={mapContainer} className="h-[500px] w-full" style={{ background: "#10171F" }} />
      {!loaded && (
        <div className="h-[500px] flex items-center justify-center bg-elevated">
          <p className="font-terminal text-sm text-text-muted animate-pulse">$ loading map...</p>
        </div>
      )}
      {/* Zoom info badge */}
      {loaded && activeCaseId && (
        <div className="absolute top-4 left-4 z-[1000]">
          <div className="rounded-md border border-border bg-elevated/90 px-3 py-1.5 font-terminal text-xs text-accent backdrop-blur-sm">
            {(() => {
              const item = items.find((i) => i.caseId === activeCaseId);
              if (!item) return "";
              const precision = item.locationPrecision || "district";
              const zoom = PRECISION_ZOOM[precision];
              return `🔍 জুম ${zoom} · ${
                precision === "street" ? "রাস্তা স্তর" :
                precision === "thana" ? "থানা স্তর" : "জেলা স্তর"
              }`;
            })()}
          </div>
        </div>
      )}
      {/* Map legend */}
      {loaded && items.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[1000] hidden md:block">
          <div className="rounded-md border border-border bg-elevated/90 px-3 py-2 text-[10px] font-terminal text-text-faint backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#8892A4]" />
              <span>জেলা স্তর · জুম ১২</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#7C8BA0]" />
              <span>থানা স্তর · জুম ১৫</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#94A4B8]" />
              <span>রাস্তা স্তর · জুম ১৮</span>
            </div>
          </div>
        </div>
      )}
      {/* Marker count badge */}
      {loaded && items.length > 0 && (
        <div className="absolute top-4 right-4 z-[1000]">
          <div className="rounded-md border border-border bg-elevated/90 px-3 py-1.5 font-terminal text-xs text-text-muted backdrop-blur-sm">
            {items.filter((i) => i.lat && i.lng).length}টি লোকেশন
          </div>
        </div>
      )}
    </div>
  );
}