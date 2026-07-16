import { useEffect, useRef, useState } from "react";

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = "&copy; <a href='https://openstreetmap.org/copyright'>OpenStreetMap</a>";

// In-memory cache for map markers (no localStorage to protect privacy)
let markersCache = [];

export default function MapView({ items = [], className = "" }) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markerLayer = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load Leaflet dynamically (not included by default)
    const loadMap = async () => {
      try {
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");

        if (!mapContainer.current || mapInstance.current) return;

        // Fix default marker icon
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        // Center on Bangladesh by default
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

  // Update markers when items change
  useEffect(() => {
    if (!loaded || !mapInstance.current || !markerLayer.current) return;

    markerLayer.current.clearLayers();

    if (!items || items.length === 0) return;

    const L = window.L; // Leaflet loaded globally
    const bounds = [];
    const bangladeshBounds = L.latLngBounds(
      [20.5, 88.0], // SW corner
      [26.7, 92.7]  // NE corner
    );

    items.forEach((item) => {
      // If item has lat/lng, use it. Otherwise, random position near a major city
      // This ensures location privacy while showing approximate area
      let lat, lng;
      
      if (item.lat && item.lng) {
        lat = item.lat;
        lng = item.lng;
      } else {
        return; // Skip items without location data
      }

      const marker = L.marker([lat, lng], {
        title: item.title || item.caseId,
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 200px;">
          <p style="font-size: 11px; color: #888; margin: 0 0 4px;">${item.caseId || ""}</p>
          <p style="font-size: 14px; font-weight: 600; margin: 0 0 4px; color: #222;">${item.title || ""}</p>
          ${item.summary ? `<p style="font-size: 12px; color: #555; margin: 0;">${item.summary.substring(0, 100)}...</p>` : ""}
          <p style="font-size: 11px; color: #888; margin: 4px 0 0;">
            ${item.type === "incident" ? "অপরাধ" : "অভিযোগ"} · ${item.location || ""}
          </p>
        </div>
      `);

      markerLayer.current.addLayer(marker);

      if (bangladeshBounds.contains([lat, lng])) {
        bounds.push([lat, lng]);
      }
    });

    if (bounds.length > 0) {
      mapInstance.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    }
  }, [items, loaded]);

  if (error) {
    return (
      <div className={`rounded-lg border border-border bg-elevated p-6 text-center ${className}`}>
        <p className="font-body text-sm text-text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden border border-border ${className}`}>
      <div ref={mapContainer} className="h-[400px] w-full" style={{ background: "#141B24" }} />
      {!loaded && (
        <div className="h-[400px] flex items-center justify-center bg-elevated">
          <p className="font-body text-sm text-text-muted">মানচিত্র লোড হচ্ছে…</p>
        </div>
      )}
    </div>
  );
}

/**
 * Convert a location string to approximate coordinates (for geocoding)
 * Uses OpenStreetMap Nominatim API (free, no key required)
 */
export async function geocodeLocation(locationString) {
  if (!locationString || locationString.trim().length < 3) return null;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString + ", Bangladesh")}&limit=1&countrycodes=bd`,
      {
        headers: {
          "User-Agent": "Nirbhoy/1.0 (civic complaint platform)",
        },
      }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get approximate location for a division/district name in Bangladesh
 * Fallback when Nominatim fails
 */
export function getApproximateLocation(locationString) {
  const locations = {
    "ঢাকা": { lat: 23.8103, lng: 90.4125 },
    "চট্টগ্রাম": { lat: 22.3569, lng: 91.7832 },
    "খুলনা": { lat: 22.8456, lng: 89.5403 },
    "রাজশাহী": { lat: 24.3745, lng: 88.6042 },
    "সিলেট": { lat: 24.8949, lng: 91.8687 },
    "বরিশাল": { lat: 22.7010, lng: 90.3535 },
    "রংপুর": { lat: 25.7439, lng: 89.2752 },
    "ময়মনসিংহ": { lat: 24.7471, lng: 90.4203 },
  };

  for (const [name, coords] of Object.entries(locations)) {
    if (locationString.includes(name)) {
      return coords;
    }
  }

  // Return Dhaka as default
  return { lat: 23.8103, lng: 90.4125 };
}