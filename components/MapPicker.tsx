import { useEffect, useRef, useState } from "react";
import { parseLocationInput } from "../lib/mapLinks";

// Reuse the same tile layer sources as MapView for a consistent look.
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

// Bangladesh bounding box — reject stray coordinates outside the country.
const BD_BOUNDS = { minLat: 20.5, maxLat: 26.7, minLng: 88.0, maxLng: 92.7 };
function inBangladesh(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= BD_BOUNDS.minLat &&
    lat <= BD_BOUNDS.maxLat &&
    lng >= BD_BOUNDS.minLng &&
    lng <= BD_BOUNDS.maxLng
  );
}

// Crime-pin icon — accent-red with crosshair so the user immediately sees
// where their report will be plotted. Uses a different colour language than
// the blue "you are here" dot.
function createPickerIcon() {
  const size = 46;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 12}" viewBox="0 0 ${size} ${size + 12}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="none" stroke="#EF4444" stroke-width="1" opacity="0.35">
        <animate attributeName="r" from="${size / 2 - 4}" to="${size / 2 + 8}" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.5" to="0" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="#DC2626" stroke="#991B1B" stroke-width="2"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 8}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
      <line x1="${size / 2}" y1="${size / 2 - 8}" x2="${size / 2}" y2="${size / 2 + 8}" stroke="#0B1121" stroke-width="1.5"/>
      <line x1="${size / 2 - 8}" y1="${size / 2}" x2="${size / 2 + 8}" y2="${size / 2}" stroke="#0B1121" stroke-width="1.5"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="2" fill="#0B1121"/>
      <path d="M${size / 2 - 5} ${size - 4} L${size / 2} ${size + 10} L${size / 2 + 5} ${size - 4} Z" fill="#DC2626" stroke="#991B1B" stroke-width="1"/>
    </svg>`;
  return {
    iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, size + 10],
    popupAnchor: [0, -size - 4],
    shadowUrl: "",
    shadowSize: [0, 0],
  };
}

// Reverse-geocode via Nominatim so the user sees a friendly address for the
// pin. This is client-side and rate-limited to one request per drag.
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&accept-language=bn,en`,
      { headers: { "Accept-Language": "bn,en;q=0.8" } }
    );
    const data = await res.json();
    return data.display_name || "";
  } catch {
    return "";
  }
}

/**
 * MapPicker — lets the user pick an exact crime location three different
 * ways: (1) click / drag on the map, (2) use the browser geolocation, or
 * (3) paste a Google Maps / OSM link or raw `lat, lng` coordinates.
 *
 * Reports the selected { lat, lng, address } via `onChange`.
 */
export default function MapPicker({
  value = null,
  onChange,
  height = 420,
  initialCenter = [23.685, 90.3563],
  initialZoom = 7,
  className = "",
}: {
  value?: { lat: number; lng: number; address?: string } | null;
  onChange?: (_v: { lat: number; lng: number; address: string } | null) => void;
  height?: number;
  initialCenter?: [number, number];
  initialZoom?: number;
  className?: string;
}) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [currentLayer, setCurrentLayer] = useState<string>("dark");
  const layerRefs = useRef<Record<string, any>>({});
  const [address, setAddress] = useState<string>(value?.address || "");
  const [locating, setLocating] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);

  // Manual input state — a single field that accepts URLs OR "lat, lng".
  const [manualInput, setManualInput] = useState("");
  const [manualHint, setManualHint] = useState("");
  const [manualError, setManualError] = useState("");

  async function getLeaflet() {
    const cached = typeof window !== "undefined" ? (window as any).L : null;
    if (cached) return cached;
    const Lmod: any = await import("leaflet");
    const L: any = Lmod.default || Lmod;
    if (typeof window !== "undefined") (window as any).L = L;
    return L;
  }

  // Load map once
  useEffect(() => {
    const loadMap = async () => {
      try {
        const L: any = await getLeaflet();
        await import("leaflet/dist/leaflet.css");

        if (!mapContainer.current || mapInstance.current) return;

        try {
          delete L.Icon.Default.prototype._getIconUrl;
        } catch {
          /* noop */
        }

        const map = L.map(mapContainer.current, {
          center: value ? [value.lat, value.lng] : initialCenter,
          zoom: value ? 17 : initialZoom,
          zoomControl: true,
          maxZoom: 20,
          zoomSnap: 0.5,
          preferCanvas: true,
        });

        // Tile layers
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

        L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);

        // Click to drop / move the pin.
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          if (!inBangladesh(lat, lng)) {
            setError("বাংলাদেশের বাইরের কোনো লোকেশন গ্রহণযোগ্য নয়।");
            setTimeout(() => setError(""), 3500);
            return;
          }
          placeMarker(L, lat, lng, true);
        });

        // If a value was passed in, drop the initial marker
        if (value && typeof value.lat === "number" && typeof value.lng === "number") {
          placeMarker(L, value.lat, value.lng, false);
        }

        mapInstance.current = map;
        setLoaded(true);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("MapPicker load error:", e);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Place or move the pin marker at [lat, lng]. If `notify` is true, tell
  // the parent form via onChange.
  function placeMarker(L: any, lat: number, lng: number, notify: boolean) {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    const icon = L.icon(createPickerIcon());

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(icon);
    } else {
      const marker = L.marker([lat, lng], {
        icon,
        draggable: true,
        riseOnHover: true,
        zIndexOffset: 500,
      }).addTo(map);
      marker.on("dragend", (ev: any) => {
        const p = ev.target.getLatLng();
        if (!inBangladesh(p.lat, p.lng)) {
          // Snap back to a valid position and warn — we can't have BD pins
          // wandering into neighbouring countries.
          setError("পিন বাংলাদেশের ভিতরেই রাখতে হবে।");
          setTimeout(() => setError(""), 3500);
          if (value) marker.setLatLng([value.lat, value.lng]);
          return;
        }
        emitChange(p.lat, p.lng);
      });
      markerRef.current = marker;
    }

    if (notify) {
      emitChange(lat, lng);
    }
  }

  async function emitChange(lat: number, lng: number) {
    setReverseLoading(true);
    const addr = await reverseGeocode(lat, lng);
    setAddress(addr);
    setReverseLoading(false);
    if (onChange) onChange({ lat, lng, address: addr });
  }

  // Draw a distinct blue pulsing "you are here" dot.
  async function drawUserMarker(latitude: number, longitude: number, accuracy: number) {
    if (!mapInstance.current) return;
    const L = await getLeaflet();

    if (userMarkerRef.current) {
      mapInstance.current.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (userAccuracyRef.current) {
      mapInstance.current.removeLayer(userAccuracyRef.current);
      userAccuracyRef.current = null;
    }

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
      zIndexOffset: 300,
      interactive: false,
    }).addTo(mapInstance.current);
  }

  // Swap tile layers
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

  // Sync external `value` changes (e.g. parent cleared the pin).
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    getLeaflet().then((L) => {
      if (cancelled) return;
      if (value && typeof value.lat === "number" && typeof value.lng === "number") {
        placeMarker(L, value.lat, value.lng, false);
      } else if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
        setAddress("");
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng, loaded]);

  function locateMe() {
    if (!mapInstance.current || !navigator.geolocation) return;
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (!inBangladesh(latitude, longitude)) {
          setError("আপনার অবস্থান বাংলাদেশের বাইরে বলে মনে হচ্ছে। মানচিত্রে ম্যানুয়ালি ক্লিক করুন।");
          setLocating(false);
          setTimeout(() => setError(""), 4500);
          // Still show the blue "you are here" so user gets orientation.
          mapInstance.current.flyTo([latitude, longitude], 12, { duration: 1.2 });
          void drawUserMarker(latitude, longitude, accuracy);
          return;
        }
        mapInstance.current.flyTo([latitude, longitude], 17, { duration: 1.2 });
        void drawUserMarker(latitude, longitude, accuracy);
        const L = await getLeaflet();
        placeMarker(L, latitude, longitude, true);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("লোকেশন অনুমোদন পাওয়া যায়নি। ব্রাউজারে পারমিশন দিন বা ম্যাপে ক্লিক করুন।");
        setTimeout(() => setError(""), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function clearMarker() {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    setAddress("");
    if (onChange) onChange(null);
  }

  // Attempts to parse whatever the user pasted / typed into the manual
  // input. Accepts Google Maps URL, OSM URL, or plain "lat, lng".
  async function applyManualInput() {
    setManualError("");
    setManualHint("");
    const parsed = parseLocationInput(manualInput);
    if (!parsed) {
      setManualError(
        "লিংক বা লোকেশন বুঝতে পারিনি। Google Maps / OpenStreetMap লিংক অথবা 'lat, lng' লিখুন।"
      );
      return;
    }
    if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng)) {
      setManualError("লোকেশনের কোঅর্ডিনেট সঠিক নয়। আবার চেষ্টা করুন।");
      return;
    }
    if (!inBangladesh(parsed.lat, parsed.lng)) {
      setManualError("এই কোঅর্ডিনেট বাংলাদেশের বাইরে।");
      return;
    }
    const L = await getLeaflet();
    if (mapInstance.current) {
      mapInstance.current.flyTo([parsed.lat, parsed.lng], 17, { duration: 1.2 });
    }
    placeMarker(L, parsed.lat, parsed.lng, true);
    setManualHint("✓ লোকেশন সেট হয়েছে");
    setManualInput("");
    setTimeout(() => setManualHint(""), 3000);
  }

  if (error && !loaded) {
    return (
      <div className={`rounded-md border border-danger/40 bg-danger-soft p-4 text-center ${className}`}>
        <p className="font-code text-sm text-danger">
          <span className="term-err">[!]</span> {error}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Manual input row — link / lat,lng entry */}
      <div className="mb-3 rounded-md border border-borderStrong bg-elevated/60 p-3">
        <label className="font-terminal text-[11px] text-text-muted tracking-wider">
          $ paste_link_or_coords
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => {
              setManualInput(e.target.value);
              setManualError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyManualInput();
              }
            }}
            placeholder="Google Maps লিংক অথবা: 23.7104, 90.4074"
            className="field-input flex-1 !py-1.5 !text-sm"
          />
          <button
            type="button"
            onClick={applyManualInput}
            disabled={!manualInput.trim()}
            className="shrink-0 rounded-md border border-accent/40 bg-accent-soft px-3 py-1.5 font-terminal text-xs text-accent hover:bg-accent hover:text-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            সেট করুন
          </button>
        </div>
        {manualError && (
          <p className="mt-1.5 font-code text-[11px] text-danger">
            <span className="term-err">[!]</span> {manualError}
          </p>
        )}
        {manualHint && (
          <p className="mt-1.5 font-code text-[11px] text-accent">{manualHint}</p>
        )}
        <p className="mt-1.5 font-terminal text-[10px] text-text-faint">
          $ সমর্থিত: Google Maps · OpenStreetMap · plain lat,lng
        </p>
      </div>

      {/* Map */}
      <div
        className="rounded-md overflow-hidden border border-borderStrong relative"
        style={{ height }}
      >
        <div
          ref={mapContainer}
          className="w-full h-full"
          style={{ background: "#0B1121" }}
        />

        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-elevated">
            <p className="font-terminal text-sm text-text-muted animate-pulse">
              $ initializing picker...
            </p>
          </div>
        )}

        {/* Top-left instruction */}
        {loaded && (
          <div className="absolute top-3 left-3 z-[1000] pointer-events-none max-w-[70%]">
            <div className="rounded-md border border-border bg-elevated/95 px-3 py-1.5 font-terminal text-[11px] text-text-muted backdrop-blur-sm shadow-lg">
              {value ? (
                <span className="text-accent">✓ পিন সেট করা হয়েছে · ড্র্যাগ করে সরাতে পারেন</span>
              ) : (
                <span>মানচিত্রে ক্লিক করুন বা ⌖ চাপুন</span>
              )}
            </div>
          </div>
        )}

        {/* Top-right controls */}
        {loaded && (
          <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2 items-end">
            <div className="flex rounded-md border border-border bg-elevated/95 backdrop-blur-sm shadow-lg overflow-hidden">
              {Object.entries(TILE_LAYERS).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCurrentLayer(key)}
                  className={`px-2 py-1 font-terminal text-[10px] transition-colors ${
                    currentLayer === key
                      ? "bg-accent text-bg"
                      : "text-text-muted hover:text-text-primary hover:bg-elevated2"
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={locateMe}
                disabled={locating}
                title="আমার অবস্থান নিন"
                className="rounded-md border border-[#5CB4FF]/40 bg-elevated/95 px-2.5 py-1.5 font-terminal text-xs text-[#5CB4FF] hover:bg-[#5CB4FF] hover:text-bg backdrop-blur-sm shadow-lg transition-colors disabled:opacity-50"
              >
                {locating ? "…" : "⌖"}
              </button>
              {value && (
                <button
                  type="button"
                  onClick={clearMarker}
                  title="পিন মুছে দিন"
                  className="rounded-md border border-danger/40 bg-elevated/95 px-2.5 py-1.5 font-terminal text-xs text-danger hover:bg-danger hover:text-bg backdrop-blur-sm shadow-lg transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom-left legend */}
        {loaded && (
          <div className="absolute bottom-3 left-3 z-[1000]">
            <div className="rounded-md border border-border bg-elevated/95 px-3 py-1.5 text-[10px] font-terminal text-text-muted backdrop-blur-sm shadow-lg">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#DC2626]" />
                  ঘটনাস্থল
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#5CB4FF]" />
                  আপনি
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selection info panel */}
      {value && (
        <div className="mt-2 rounded-md border border-accent/30 bg-accent-soft/40 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-terminal text-[11px] text-accent tracking-wider">
                $ selected_location
              </p>
              <p className="mt-1 font-code text-xs text-text-primary break-words">
                {reverseLoading
                  ? "$ resolving address..."
                  : address || "$ ঠিকানা পাওয়া যায়নি"}
              </p>
              <p className="mt-1 font-terminal text-[10px] text-text-faint">
                LAT {value.lat.toFixed(6)} · LNG {value.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 rounded-md border border-danger/40 bg-danger-soft px-3 py-2 font-code text-xs text-danger">
          <span className="term-err">[!]</span> {error}
        </p>
      )}
    </div>
  );
}
