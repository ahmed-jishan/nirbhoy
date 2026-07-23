declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

// Cloudinary upload widget result type
interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  resource_type: string;
  created_at: string;
  tags: string[];
  signature: string;
  version: number;
}

// Navigator deviceMemory (non-standard but widely supported)
interface Navigator {
  deviceMemory?: number;
}
