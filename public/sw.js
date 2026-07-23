/**
 * Nirbhoy Service Worker
 * 
 * Cache strategy:
 * - Static assets (CSS, JS, fonts, icons): Cache-first (offline-ready)
 * - API responses: Network-first with fallback to cache
 * - Pages: Network-first with offline fallback
 * 
 * This SW is registered conditionally — only when the browser supports it
 * and the app is served over HTTPS or localhost.
 */

const CACHE_NAME = "nirbhoy-v2";
const STATIC_CACHE = "nirbhoy-static-v2";
const API_CACHE = "nirbhoy-api-v2";

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  "/",
  "/feed",
  "/track",
  "/how-it-works",
  "/safety",
  "/faq",
  "/stats",
  "/privacy",
  "/terms",
  "/offline",
  "/manifest.json",
  "/favicon.svg",
  "/icons/pwa-icon.svg",
  "/icons/icon-512.svg",
];

// Install event — pre-cache key static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[SW] Precache error:", err);
        // Don't fail installation — some assets might be unavailable
      });
    })
  );
  // Activate immediately — don't wait for page reload
  self.skipWaiting();
});

// Activate event — clean up old caches
self.addEventListener("activate", (event) => {
  const validCaches = [CACHE_NAME, STATIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !validCaches.includes(key))
          .map((key) => caches.delete(key))
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event — smart cache strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;
  
  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Next.js build assets are content-hashed. Let the browser fetch them
  // directly so a stale service-worker cache can never keep old client code.
  if (url.pathname.startsWith("/_next/")) return;
  
  // Skip browser-sync / hot-reload requests in dev
  if (url.pathname.includes("__nextjs") || url.pathname.includes("webpack")) return;

  // Strategy 1: Static assets (JS, CSS, fonts, images) — Cache-first
  if (
    url.pathname.match(/\.(woff2?|ttf|otf|eot|png|jpg|jpeg|gif|svg|ico|webp)$/) ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Strategy 2: API calls — Network-first with timeout
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstWithTimeout(request, 3000));
    return;
  }

  // Strategy 3: Navigation requests (pages) — Network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithFallback(request, "/offline"));
    return;
  }

  // Default: Network-first
  event.respondWith(networkFirst(request));
});

/**
 * Cache-first strategy: serve from cache, update cache in background.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Background update
    caches.open(STATIC_CACHE).then((cache) => {
      fetch(request).then((response) => {
        if (response.ok) cache.put(request, response);
      }).catch(() => {});
    });
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

/**
 * Network-first strategy: try network, fall back to cache.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("Offline", { status: 503 });
  }
}

/**
 * Network-first with timeout: try network for ms ms, then cache.
 */
async function networkFirstWithTimeout(request, ms) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), ms)
  );

  try {
    const response = await Promise.race([fetch(request), timeoutPromise]);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: "অফলাইন" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Network-first with fallback page on failure.
 */
async function networkFirstWithFallback(request, fallbackUrl) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    // If the response is a 404/500 from server, serve our offline page
    if (!response.ok && response.status >= 400) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    return response;
  } catch {
    const fallback = await caches.match(fallbackUrl);
    if (fallback) return fallback;
    // Last resort: try any cached version
    const cached = await caches.match(request);
    return cached || new Response("Offline", { status: 503 });
  }
}