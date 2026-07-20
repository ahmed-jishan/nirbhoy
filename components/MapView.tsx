import { useEffect, useRef, useState } from "react";

// Tile layer sources — dark by default to match the terminal aesthetic
const TILE_LAYERS = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      "&copy; <a href='https://openstreetmap.org/copyright'>OSM</a> · &copy; <a href='https://carto.com/attributions'>CARTO</a>",
    maxZoom: 20,
    label: "Dark",
  },
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; <a href='https://openstreetmap.org/copyright'>OpenStreetMap</a>",
    maxZoom: 19,
    label: "Street",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
    label: "Satellite",
  },
};

// Zoom levels based on location precision — higher = more zoomed in
const PRECISION_ZOOM = {
  exact: 19, // user-picked exact spot
  street: 18,
  thana: 15,
  district: 12,
  default: 7,
};

// Approximate radius (meters) for each precision level — used to draw an
// uncertainty circle so viewers know how precise a report really is.
const PRECISION_RADIUS_M = {
  exact: 25,
  street: 120,
  thana: 3500,
  district: 15000,
};

const PRECISION_LABEL_BN = {
  exact: "সঠিক অবস্থান",
  street: "রাস্তা স্তর",
  thana: "থানা স্তর",
  district: "জেলা স্তর",
};

// Marker color based on complaint type — incidents are red-ish, grievances neutral
function getMarkerColors(type, isActive) {
  if (type === "incident") {
    return {
      bg: isActive ? "#EF4444" : "#DC2626",
      border: isActive ? "#FCA5A5" : "#991B1B",
      text: "#0B1121",
    };
  }
  return {
    bg: isActive ? "#14B8A6" : "#0D9488",
    border: isActive ? "#5EEAD4" : "#0F766E",
    text: "#0B1121",
  };
}

// Custom marker icon SVG as data URI
function createMarkerIcon({ caseId, type, isActive, precision }) {
  const num = caseId ? String(caseId).split("-").pop() : "?";
  const { bg, border, text } = getMarkerColors(type, isActive);
  const size = isActive ? 46 : 40;
  const halo = isActive
    ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="none" stroke="${bg}" stroke-width="1" opacity="0.4"><animate attributeName="r" from="${size / 2 - 4}" to="${size / 2 + 6}" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.5" to="0" dur="1.6s" repeatCount="indefinite"/></circle>`
    : "";
  const precisionDot =
    precision === "exact"
      ? `<circle cx="${size / 2}" cy="${size / 2 - 2}" r="2" fill="${text}"/>`
      : "";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}">
      ${halo}
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="${bg}" stroke="${border}" stroke-width="2"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 6}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
      <text x="${size / 2}" y="${size / 2 + 4}" text-anchor="middle" fill="${text}" font-family="'VT323',monospace" font-size="13" font-weight="bold">${num}</text>
      ${precisionDot}
      <path d="M${size / 2 - 4} ${size - 4} L${size / 2} ${size + 6} L${size / 2 + 4} ${size - 4} Z" fill="${bg}" stroke="${border}" stroke-width="1"/>
    </svg>`;
  const encoded = encodeURIComponent(svg);
  return {
    iconUrl: `data:image/svg+xml,${encoded}`,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 6],
    popupAnchor: [0, -size - 4],
    shadowUrl: "",
    shadowSize: [0, 0],
  };
}

function precisionLabelBn(p) {
  return PRECISION_LABEL_BN[p] || PRECISION_LABEL_BN.district;
}

export default function MapView({
  items = [],
  className = "",
  activeCaseId = null,
  onCaseSelect = null,
  height = 520,
}) {
  const mapContainer = useRef(null);
  const wrapperRef = useRef(null);
  const mapInstance = useRef(null);
  const markerLayer = useRef(null);
  const circleLayer = useRef(null);
  const userMarkerRef = useRef(null);
  const userAccuracyRef = useRef(null);
  const markersRef = useRef({});
  const circlesRef = useRef({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const initialFitDone = useRef(false);
  const flyTimeoutRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentLayer, setCurrentLayer] = useState("dark");
  const layerRefs = useRef({});

  // Load map
  useEffect(() => {
    const loadMap = async () => {
      try {
        const Lmod: any = await import("leaflet");
        const L: any = Lmod.default || Lmod;
        await import("leaflet/dist/leaflet.css");
        if (typeof window !== "undefined") (window as any).L = L;

        if (!mapContainer.current || mapInstance.current) return;

        try {
          delete L.Icon.Default.prototype._getIconUrl;
        } catch {
          /* noop */
        }


        const map = L.map(mapContainer.current, {
          center: [23.685, 90.3563],
          zoom: 7,
          zoomControl: true,
          attributionControl: true,
          maxZoom: 20,
          zoomSnap: 0.5,
          wheelPxPerZoomLevel: 120,
          preferCanvas: true,
        });

        // Build tile layers
        const layers: any = {};
        Object.entries(TILE_LAYERS).forEach(([key, cfg]) => {
          layers[key] = L.tileLayer(cfg.url, {

            attribution: cfg.attribution,
            maxZoom: cfg.maxZoom,
            subdomains: key === "satellite" ? "" : "abc",
          });
        });
        layerRefs.current = layers;
        layers.dark.addTo(map);

        // Scale control (metric only, small)
        L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);

        markerLayer.current = L.layerGroup().addTo(map);
        circleLayer.current = L.layerGroup().addTo(map);
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

  // Swap active tile layer
  useEffect(() => {
    if (!loaded || !mapInstance.current) return;
    Object.entries(layerRefs.current).forEach(([key, layerRaw]) => {
      const layer: any = layerRaw;
      if (key === currentLayer) {
        if (!mapInstance.current.hasLayer(layer)) layer.addTo(mapInstance.current);
      } else if (mapInstance.current.hasLayer(layer)) {
        mapInstance.current.removeLayer(layer);
      }
    });
  }, [currentLayer, loaded]);


  // Update markers when items change
  useEffect(() => {
    if (!loaded || !mapInstance.current || !markerLayer.current) return;

    markerLayer.current.clearLayers();
    circleLayer.current.clearLayers();
    markersRef.current = {};
    circlesRef.current = {};

    if (!items || items.length === 0) return;

    // Access Leaflet on window (already loaded by the import)
    // Fallback: re-import synchronously (returns cached module)
    const L = window.L || require("leaflet");
    const bounds = [];
    const bangladeshBounds = L.latLngBounds([20.5, 88.0], [26.7, 92.7]);

    items.forEach((item) => {
      if (!item.lat || !item.lng) return;

      const precision = item.locationPrecision || "district";
      const icon = L.icon(
        createMarkerIcon({
          caseId: item.caseId,
          type: item.type,
          isActive: item.caseId === activeCaseId,
          precision,
        })
      );

      // Uncertainty circle — helps viewers understand precision
      const radius = PRECISION_RADIUS_M[precision] || PRECISION_RADIUS_M.district;
      const circleColor = item.type === "incident" ? "#DC2626" : "#0D9488";
      const circle = L.circle([item.lat, item.lng], {
        radius,
        color: circleColor,
        weight: precision === "exact" ? 2 : 1,
        opacity: 0.55,
        fillColor: circleColor,
        fillOpacity: precision === "exact" ? 0.15 : 0.06,
        interactive: false,
      });
      circleLayer.current.addLayer(circle);
      circlesRef.current[item.caseId] = circle;

      const marker = L.marker([item.lat, item.lng], {
        icon,
        title: item.caseId,
        riseOnHover: true,
      });

      // Popup content
      const typeBn = item.type === "incident" ? "অপরাধ / ঘটনা" : "সাধারণ অভিযোগ";
      const typeColor = item.type === "incident" ? "#EF4444" : "#14B8A6";
      const publishedAt = item.publishedAt
        ? new Date(item.publishedAt).toLocaleDateString("bn-BD", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "";
      marker.bindPopup(
        `
        <div style="font-family:'Space Grotesk',system-ui,sans-serif;min-width:250px;max-width:280px;background:#0B1121;color:#F1F5F9;border:1px solid rgba(13,148,136,0.25);">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.06);padding:10px 12px;background:rgba(13,148,136,0.06);">
            <span style="font-family:'VT323',monospace;font-size:13px;color:${typeColor};letter-spacing:0.5px;">${item.caseId || ""}</span>
            <span style="font-family:'VT323',monospace;font-size:10px;color:#94A3B8;">📍 ${precisionLabelBn(precision)}</span>
          </div>
          <div style="padding:12px;">
            <div style="display:inline-block;padding:2px 6px;margin-bottom:8px;font-family:'VT323',monospace;font-size:10px;color:${typeColor};background:rgba(13,148,136,0.1);border:1px solid rgba(13,148,136,0.3);">${typeBn}</div>
            <p style="font-size:14px;font-weight:600;margin:0 0 6px;color:#F1F5F9;line-height:1.35;">${item.title || ""}</p>
            ${item.summary ? `<p style="font-size:12px;color:#94A3B8;margin:0 0 8px;border-left:2px solid ${typeColor};padding-left:8px;line-height:1.5;">${item.summary.substring(0, 140)}${item.summary.length > 140 ? "…" : ""}</p>` : ""}
            <div style="font-family:'VT323',monospace;font-size:11px;color:#94A3B8;border-top:1px solid rgba(255,255,255,0.06);padding-top:8px;margin-top:8px;">
              <div style="display:flex;justify-content:space-between;gap:8px;">
                <span style="color:#14B8A6;">${item.location ? item.location.split(",").slice(0, 2).join(", ") : "স্থান উল্লেখ নেই"}</span>
                ${publishedAt ? `<span>${publishedAt}</span>` : ""}
              </div>
              <div style="margin-top:4px;font-size:10px;color:#64748B;">
                LAT ${item.lat.toFixed(4)} · LNG ${item.lng.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      `,
        { className: "nirbhoy-popup", maxWidth: 300, closeButton: true }
      );

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
      mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
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

    const precision = item.locationPrecision || "district";
    const zoom = PRECISION_ZOOM[precision] || PRECISION_ZOOM.district;

    if (flyTimeoutRef.current) clearTimeout(flyTimeoutRef.current);

    mapInstance.current.flyTo(marker.getLatLng(), zoom, {
      duration: 1.4,
      easeLinearity: 0.3,
    });

    flyTimeoutRef.current = setTimeout(() => {
      marker.openPopup();
    }, 1500);
  }, [activeCaseId, loaded, items]);

  // Re-render markers when active changes (for animation halo)
  useEffect(() => {
    if (!loaded) return;
    Object.entries(markersRef.current).forEach(([caseId, markerRaw]) => {
      const marker: any = markerRaw;
      const item = items.find((i) => i.caseId === caseId);
      if (!item) return;
      const L = (window as any).L || require("leaflet");
      const icon = L.icon(
        createMarkerIcon({
          caseId,
          type: item.type,
          isActive: caseId === activeCaseId,
          precision: item.locationPrecision || "district",
        })
      );
      marker.setIcon(icon);
    });
  }, [activeCaseId, loaded, items]);


  // Handle fullscreen toggle — the wrapper gets fixed positioning
  function toggleFullscreen() {
    setIsFullscreen((prev) => !prev);
  }

  useEffect(() => {
    // When fullscreen changes, Leaflet needs to recalculate size
    if (mapInstance.current) {
      setTimeout(() => mapInstance.current.invalidateSize(), 250);
    }
  }, [isFullscreen]);

  // Places / updates a distinct "you are here" marker with an accuracy ring.
  // We deliberately use a different visual language (blue pulsing dot) from
  // report markers so the viewer never confuses their own position with an
  // actual crime pin.
  function drawUserMarker(latitude, longitude, accuracy) {
    if (!mapInstance.current) return;
    const L = (window as any).L || require("leaflet");

    // Remove any previous instances so repeated clicks don't stack.
    if (userMarkerRef.current) {
      mapInstance.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (userAccuracyRef.current) {
      mapInstance.current.removeLayer(userAccuracyRef.current);
      userAccuracyRef.current = null;
    }

    // Accuracy circle — a subtle blue ring indicating GPS uncertainty.
    if (accuracy && Number.isFinite(accuracy) && accuracy > 0 && accuracy < 5000) {
      userAccuracyRef.current = L.circle([latitude, longitude], {
        radius: accuracy,
        color: "#5CB4FF",
        weight: 1,
        opacity: 0.5,
        fillColor: "#5CB4FF",
        fillOpacity: 0.08,
        interactive: false,
      }).addTo(mapInstance.current);
    }

    // Blue pulsing dot rendered via SVG data URI so we don't need extra
    // stylesheets. The animated ring conveys "live position".
    const dotSize = 22;
    const dotSvg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='${dotSize + 30}' height='${dotSize + 30}' viewBox='0 0 ${dotSize + 30} ${dotSize + 30}'>
        <circle cx='${(dotSize + 30) / 2}' cy='${(dotSize + 30) / 2}' r='${dotSize / 2 + 2}' fill='#5CB4FF' opacity='0.25'>
          <animate attributeName='r' from='${dotSize / 2}' to='${dotSize / 2 + 12}' dur='1.8s' repeatCount='indefinite'/>
          <animate attributeName='opacity' from='0.4' to='0' dur='1.8s' repeatCount='indefinite'/>
        </circle>
        <circle cx='${(dotSize + 30) / 2}' cy='${(dotSize + 30) / 2}' r='${dotSize / 2 - 4}' fill='#0B1121' stroke='#5CB4FF' stroke-width='2'/>
        <circle cx='${(dotSize + 30) / 2}' cy='${(dotSize + 30) / 2}' r='${dotSize / 2 - 8}' fill='#5CB4FF'/>
      </svg>`;
    const userIcon = L.icon({
      iconUrl: `data:image/svg+xml,${encodeURIComponent(dotSvg)}`,
      iconSize: [dotSize + 30, dotSize + 30],
      iconAnchor: [(dotSize + 30) / 2, (dotSize + 30) / 2],
      popupAnchor: [0, -dotSize / 2],
      shadowUrl: "",
      shadowSize: [0, 0],
    });

    userMarkerRef.current = L.marker([latitude, longitude], {
      icon: userIcon,
      title: "আপনার অবস্থান",
      interactive: true,
      zIndexOffset: 1000,
    }).addTo(mapInstance.current);

    userMarkerRef.current.bindPopup(
      `<div style="font-family:'Space Grotesk',sans-serif;padding:6px 4px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#5CB4FF;">📍 আপনি এখানে আছেন</p>
        <p style="margin:0;font-family:'VT323',monospace;font-size:11px;color:#94A3B8;">
          LAT ${latitude.toFixed(5)}<br/>LNG ${longitude.toFixed(5)}
          ${accuracy ? `<br/>নির্ভুলতা ≈ ${Math.round(accuracy)}m` : ""}
        </p>
      </div>`,
      { className: "nirbhoy-popup" }
    );
  }

  // Locate current user — fly to position and drop the pulsing marker.
  function locateMe() {
    if (!mapInstance.current) return;
    if (!navigator.geolocation) {
      setLocateError("এই ব্রাউজারে জিওলোকেশন সমর্থিত নয়।");
      setTimeout(() => setLocateError(""), 4000);
      return;
    }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        mapInstance.current.flyTo([latitude, longitude], 16, { duration: 1.2 });
        drawUserMarker(latitude, longitude, accuracy);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        const msg =
          err.code === 1
            ? "লোকেশন অনুমোদন দেওয়া হয়নি। ব্রাউজার সেটিংস থেকে অনুমতি দিন।"
            : err.code === 3
            ? "লোকেশন পেতে সময় বেশি লাগছে। আবার চেষ্টা করুন।"
            : "লোকেশন পাওয়া যায়নি।";
        setLocateError(msg);
        setTimeout(() => setLocateError(""), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  // Reset view to Bangladesh — also clears the user location marker so the
  // map returns to its "clean" default state.
  function resetView() {
    if (!mapInstance.current) return;
    initialFitDone.current = false;
    if (userMarkerRef.current) {
      mapInstance.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (userAccuracyRef.current) {
      mapInstance.current.removeLayer(userAccuracyRef.current);
      userAccuracyRef.current = null;
    }
    const bounds = items
      .filter((i) => i.lat && i.lng)
      .map((i) => [i.lat, i.lng]);
    if (bounds.length > 0) {
      mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    } else {
      mapInstance.current.setView([23.685, 90.3563], 7);
    }
  }

  if (error) {
    return (
      <div className={`rounded-none border border-danger/40 bg-danger-soft p-6 text-center ${className}`}>
        <p className="font-code text-sm text-danger"><span className="term-err">[!]</span> {error}</p>
      </div>
    );
  }

  const wrapperStyle: React.CSSProperties = isFullscreen
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        borderRadius: 0,
      }
    : { height };


  return (
    <div
      ref={wrapperRef}
      className={`rounded-md overflow-hidden border border-border relative ${className}`}
      style={wrapperStyle}
    >
      <div
        ref={mapContainer}
        className="w-full"
        style={{ background: "#0B1121", height: isFullscreen ? "100vh" : `${height}px` }}
      />

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-elevated">
          <p className="font-terminal text-sm text-text-muted animate-pulse">$ initializing map...</p>
        </div>
      )}

      {/* Top-left: active case zoom info */}
      {loaded && activeCaseId && (
        <div className="absolute top-3 left-3 z-[1000] pointer-events-none">
          <div className="rounded-md border border-accent/40 bg-elevated/95 px-3 py-1.5 font-terminal text-xs text-accent backdrop-blur-sm shadow-lg">
            {(() => {
              const item = items.find((i) => i.caseId === activeCaseId);
              if (!item) return "";
              const precision = item.locationPrecision || "district";
              const zoom = PRECISION_ZOOM[precision];
              return `🔍 zoom ${zoom} · ${precisionLabelBn(precision)}`;
            })()}
          </div>
        </div>
      )}

      {/* Top-right: control cluster (marker count + tools) */}
      {loaded && (
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2 items-end">
          {items.length > 0 && (
            <div className="rounded-md border border-border bg-elevated/95 px-3 py-1.5 font-terminal text-xs text-text-muted backdrop-blur-sm shadow-lg">
              {items.filter((i) => i.lat && i.lng).length}টি লোকেশন
            </div>
          )}

          {/* Layer switcher */}
          <div className="flex rounded-md border border-border bg-elevated/95 backdrop-blur-sm shadow-lg overflow-hidden">
            {Object.entries(TILE_LAYERS).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCurrentLayer(key)}
                className={`px-2.5 py-1.5 font-terminal text-[11px] transition-colors ${
                  currentLayer === key
                    ? "bg-accent text-bg"
                    : "text-text-muted hover:text-text-primary hover:bg-elevated2"
                }`}
                title={cfg.label}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Tool buttons */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={locateMe}
              disabled={locating}
              title="আমার অবস্থান"
              className={`rounded-md border px-2.5 py-1.5 font-terminal text-xs backdrop-blur-sm shadow-lg transition-colors disabled:opacity-60 ${
                userMarkerRef.current
                  ? "border-[#5CB4FF]/60 bg-[#5CB4FF]/15 text-[#5CB4FF]"
                  : "border-border bg-elevated/95 text-text-muted hover:text-[#5CB4FF] hover:border-[#5CB4FF]/40"
              }`}
            >
              {locating ? "…" : "⌖"}
            </button>
            <button
              type="button"
              onClick={resetView}
              title="রিসেট"
              className="rounded-md border border-border bg-elevated/95 px-2.5 py-1.5 font-terminal text-xs text-text-muted hover:text-accent hover:border-accent/40 backdrop-blur-sm shadow-lg transition-colors"
            >
              ⟲
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? "সংকুচিত" : "পূর্ণ পর্দা"}
              className="rounded-md border border-border bg-elevated/95 px-2.5 py-1.5 font-terminal text-xs text-text-muted hover:text-accent hover:border-accent/40 backdrop-blur-sm shadow-lg transition-colors"
            >
              {isFullscreen ? "✕" : "⛶"}
            </button>
          </div>
        </div>
      )}

      {/* Bottom-left: legend */}
      {loaded && items.length > 0 && (
        <div className="absolute bottom-3 left-3 z-[1000] hidden md:block">
          <div className="rounded-md border border-border bg-elevated/95 px-3 py-2 text-[10px] font-terminal text-text-muted backdrop-blur-sm shadow-lg max-w-[220px]">
            <p className="text-text-primary mb-1.5 tracking-wider">$ legend</p>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#DC2626]" />
              <span>অপরাধ / ঘটনা</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0D9488]" />
              <span>সাধারণ অভিযোগ</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#5CB4FF]" />
              <span>আপনার অবস্থান</span>
            </div>
            <div className="border-t border-border pt-1.5">
              <div className="flex items-center gap-2 text-text-faint">
                <span className="inline-block h-2 w-2 rounded-full bg-transparent border border-accent" />
                <span>উজ্জ্বল বৃত্ত = নির্ভুলতা</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom-center: locate error toast */}
      {locateError && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1001]">
          <div className="rounded-md border border-danger/50 bg-danger-soft/95 px-3 py-1.5 font-code text-xs text-danger backdrop-blur-sm shadow-lg">
            <span className="term-err">[!]</span> {locateError}
          </div>
        </div>
      )}
    </div>
  );
}
