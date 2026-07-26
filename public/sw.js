/**
 * Nirbhoy Service Worker
 * 
 * Cache strategy:
 * - Static assets (CSS, JS, fonts, icons): Cache-first (offline-ready)
 * - API responses: Network-first with fallback to cache
 * - Pages: Stale-while-revalidate (serve cached instantly, update in background)
 * 
 * This SW is registered conditionally — only when the browser supports it
 * and the app is served over HTTPS or localhost.
 */

const CACHE_NAME = "nirbhoy-v3";
const STATIC_CACHE = "nirbhoy-static-v3";
const API_CACHE = "nirbhoy-api-v3";

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
    event.respondWith(networkFirstWithTimeout(request, 5000));
    return;
  }

  // Strategy 3: Navigation requests (pages) — Stale-while-revalidate
  // Serve cached version immediately, then update in background.
  // Only show offline page if there's truly no cached version AND network fails.
  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(request));
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
 * Network-first with timeout for API calls.
 *
 * IMPORTANT: We must NOT fabricate a fake "offline" response just because
 * the network is slow. A fresh visitor has no cached API data, so a slow
 * server (e.g. serverless cold start) would otherwise produce a bogus
 * offline error on the very first load — which then disappears on refresh.
 *
 * Behaviour:
 *   - If a cached response exists → race network against `ms`; on timeout
 *     serve the cache instantly while the network keeps updating it.
 *   - If no cache exists → wait for the real network response, however long
 *     it takes. Only return the offline payload if the network genuinely
 *     fails (device offline / DNS error / connection refused).
 */
async function networkFirstWithTimeout(request, ms) {
  const cached = await caches.match(request);

  // Kick off the network request and cache successful responses.
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(API_CACHE).then((cache) => {
          cache.put(request, response.clone());
        });
      }
      return response;
    });

  // With a cached copy available, fall back to it quickly on slow networks.
  if (cached) {
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(cached), ms)
    );
    try {
      return await Promise.race([networkPromise, timeoutPromise]);
    } catch {
      // Network errored before the timeout — serve the cache.
      return cached;
    }
  }

  // No cache — wait for the genuine network result. Never fabricate offline
  // on a slow-but-working connection.
  try {
    return await networkPromise;
  } catch {
    return new Response(JSON.stringify({ error: "অফলাইন" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Stale-while-revalidate for navigation requests.
 * 
 * 1. Return cached version immediately (if available) — no waiting for network.
 * 2. Fetch fresh version from network in the background.
 * 3. If no cache exists, try network with a generous timeout.
 * 4. Only show offline page if both cache AND network fail.
 */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  // If we have a cached version, return it immediately and update in background
  if (cached) {
    // Background revalidation — don't block the page load
    caches.open(CACHE_NAME).then((cache) => {
      fetchWithTimeout(request, 8000).then((response) => {
        if (response && response.ok) {
          cache.put(request, response);
        }
      }).catch(() => {
        // Network failed during revalidation — cached version is still fine
      });
    });
    return cached;
  }
  
  // No cache available — try network with a generous timeout
  try {
    const response = await fetchWithTimeout(request, 10000);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      return response;
    }
    // Server returned an error (4xx/5xx) — show the error page
    if (response) return response;
  } catch {
    // Network completely unavailable — show offline page
  }
  
  // Last resort: try to serve the offline page from cache
  const offlinePage = await caches.match("/offline");
  return offlinePage || new Response("Offline", { status: 503 });
}

/**
 * Fetch with a timeout. Returns null on timeout/error.
 */
async function fetchWithTimeout(request, ms) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  
  try {
    const response = await fetch(request, { signal: controller.signal });
    return response;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}