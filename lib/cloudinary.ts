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
export function signedProofUrl(publicId, resourceType = "image") {
  ensureConfigured();
  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60; // 5 minutes
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
  });
}
