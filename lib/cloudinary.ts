import { v2 as cloudinary } from "cloudinary";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export function getCloudinary() {
  ensureConfigured();
  return cloudinary;
}

// Generates a short-lived signed URL for a proof file so it is never
// publicly guessable — only an authenticated admin request can produce one.
// Also strips EXIF/GPS metadata via `fl_strip_profile` so camera serial
// numbers and GPS coordinates never leak through the CDN.
export function signedProofUrl(publicId, resourceType = "image") {
  ensureConfigured();
  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60; // 5 minutes
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
    // Strip all embedded metadata (EXIF, GPS, camera serial, etc.)
    // at the CDN level — no reporter data ever reaches the viewer.
    ...(resourceType === "image" ? { fl_strip_profile: true } : {}),
  });
}
