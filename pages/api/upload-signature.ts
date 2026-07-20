import { getCloudinary } from "../../lib/cloudinary";
import { randomUUID } from "crypto";
import { logger } from "../../lib/logger";

const FOLDER = "nirbhoy/proofs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const cloudinary = getCloudinary();
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = randomUUID();

    // Only sign the parameters we control server-side. type=authenticated
    // means the uploaded file can never be viewed via a plain URL — only
    // via a short-lived signed URL we generate for logged-in admins.
    //
    // eager=fl_strip_profile strips all EXIF/GPS metadata at the CDN
    // level during upload — before the file is even stored. This ensures
    // camera serial numbers, GPS coordinates, and device info never
    // persist on Cloudinary's servers.
    const paramsToSign = {
      timestamp,
      folder: FOLDER,
      public_id: publicId,
      type: "authenticated",
      eager: "fl_strip_profile",
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

    return res.status(200).json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder: FOLDER,
      publicId,
      type: "authenticated",
    });
  } catch (err) {
    logger.error({ err }, "POST /api/upload-signature failed");
    return res.status(500).json({ error: "Could not prepare file upload right now." });
  }
}
