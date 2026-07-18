import type { RuntimeCaching } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkFirst, RangeRequestsPlugin, StaleWhileRevalidate } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// Inject precache configuration types safely for compiler processing stability
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const PAGES_CACHE_NAME = {
  rscPrefetch: "pages-rsc-prefetch",
  rsc: "pages-rsc",
  html: "pages",
} as const;

const defaultCache: RuntimeCaching[] =
  process.env.NODE_ENV !== "production"
    ? []
    : [
        {
          matcher: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
          handler: new CacheFirst({
            cacheName: "google-fonts-webfonts",
            plugins: [
              new ExpirationPlugin({
                maxEntries: 4,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
                maxAgeFrom: "last-used",
              }),
            ],
          }),
        },
        {
          matcher: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
          handler: new StaleWhileRevalidate({
            cacheName: "google-fonts-stylesheets",
            plugins: [
              new ExpirationPlugin({
                maxEntries: 4,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                maxAgeFrom: "last-used",
              }),
            ],
          }),
        },
        {
          matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
          handler: new StaleWhileRevalidate({
            cacheName: "static-font-assets",
            plugins: [
              new ExpirationPlugin({
                maxEntries: 4,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                maxAgeFrom: "last-used",
              }),
            ],
          }),
        },
        {
          matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
          handler: new StaleWhileRevalidate({
            cacheName: "static-image-assets",
            plugins: [
              new ExpirationPlugin({
                maxEntries: 64,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                maxAgeFrom: "last-used",
              }),
            ],
          }),
        },
        {
          matcher: /\/_next\/static.+\.js$/i,
          handler: new CacheFirst({
            cacheName: "next-static-js-assets",
            plugins: [
              new ExpirationPlugin({
                maxEntries: 64,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
                maxAgeFrom: "last-used",
              }),
            ],
          }),
        },
        {
          matcher: /\/_next\/image\?url=.+$/i,
          handler: new StaleWhileRevalidate({
            cacheName: "next-image",
            plugins: [
              new ExpirationPlugin({
                maxEntries: 64,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
                maxAgeFrom: "last-used",
              }),
            ],
          }),
        },
        {
          matcher: /\.(?:mp3|wav|ogg)$/i,
          handler: new CacheFirst({
            cacheName: "static-audio-assets",
            plugins: [
              new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
                maxAgeFrom: "last-used",
              }),
              new RangeRequestsPlugin(),
            ],
          }),
        },
        {
          matcher: /\.(?:mp4|webm)$/i,
          handler: new CacheFirst({
            cacheName: "static-video-assets",
            plugins: [
              new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
                maxAgeFrom: "last-used",
              }),
              new RangeRequestsPlugin(),
            ],
          }),
        },
        {
          matcher: /\.(?:js)$/i,
          handler: new StaleWhileRevalidate({
            cacheName: "static-js-assets",
            plugins: [
              new ExpirationPlugin({
                maxEntries: 48,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
                maxAgeFrom: "last-used",
              }),
            ],
          }),
        },
        {
          matcher: /\.(?:css|less)$/i,
          handler: new StaleWhileRevalidate({
            cacheName: "static-style-assets",
            plugins: [
              new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
                maxAgeFrom: "last-used",
              }),
            ],
          }),
        },
        {
          matcher: /\/_next\/data\/.+\/.+\.json$/i,
          handler: new NetworkFirst({
            cacheName: "next-data",
            plugins: [
              new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
                maxAgeFrom: "last-used",
              }),
            ],
          }),
        },
        {
          matcher: /\.(?:json|xml|csv)$/i,
          handler: new NetworkFirst({
            cacheName: "static-data-assets",
            plugins: [
              new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
                maxAgeFrom: "last-used",
              }),
            ],
          }),
        },
        {
          matcher: ({ sameOrigin, url: { pathname } }) => {
            // Safe exclusion to keep Safari authentication hooks processing natively
            if (!sameOrigin || pathname.startsWith("/api/auth/callback")) {
              return false;
            }
            return pathname.startsWith("/api/");
          },
          method: "GET",
          handler: new NetworkFirst({
            cacheName: "apis",
            plugins: [
              new ExpirationPlugin({
                maxEntries: 16,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
                maxAgeFrom: "last-used",
              }),
            ],
            networkTimeoutSeconds: 10,
          }),
        },
        {
          matcher: ({ request, url: { pathname }, sameOrigin }) =>
            request.headers.get("RSC") === "1" && request.headers.get("Next-Router-Prefetch") === "1" && sameOrigin && !pathname.startsWith("/api/"),
          handler: new NetworkFirst({
            cacheName: PAGES_CACHE_NAME.rscPrefetch,
          }),
        },
        {
          matcher: ({ request, url: { pathname }, sameOrigin }) => request.headers.get("RSC") === "1" && sameOrigin && !pathname.startsWith("/api/"),
          handler: new CacheFirst({
            cacheName: "serwist-precache",
            plugins: [
              {
                cacheKeyWillBeUsed: async ({ request }) => {
                  const url = new URL(request.url);
                  console.log("[BLUOMmusic SW] Evaluating Request URL:", url.toString());

                  // Intercept entries within static build caches
                  const cache = await caches.open("serwist-precache");
                  const keys = await cache.keys();

                  // Match incoming requests against active resource paths
                  const matchingKey = keys.find(key => {
                    const keyUrl = new URL(key.url);
                    return keyUrl.pathname === url.pathname;
                  });

                  if (matchingKey) {
                    console.log("[BLUOMmusic SW] Core Cache Hit:", matchingKey.url);
                    return new Request(matchingKey.url, {
                      headers: request.headers,
                      method: request.method,
                      mode: request.mode,
                      credentials: request.credentials
                    });
                  }

                  // Handle path mapping fallbacks for runtime processing
                  url.searchParams.delete('_rsc');
                  const newRequest = new Request(url.toString(), request);
                  console.log("[BLUOMmusic SW] Cache Miss, fetching stream:", newRequest.url);
                  return newRequest;
                }
              }
            ]
          })
        },
        {
          matcher: ({ request, url: { pathname }, sameOrigin }) =>
            request.headers.get("Content-Type")?.includes("text/html") && sameOrigin && !pathname.startsWith("/api/"),
          handler: new NetworkFirst({
            cacheName: PAGES_CACHE_NAME.html,
          }),
        },
        {
          matcher: ({ url: { pathname }, sameOrigin }) => sameOrigin && !pathname.startsWith("/api/"),
          handler: new NetworkFirst({
            cacheName: "others",
            plugins: [
              new ExpirationPlugin({
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
              }),
            ],
          }),
        },
      ];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cacheName: "serwist-precache",
  },
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
