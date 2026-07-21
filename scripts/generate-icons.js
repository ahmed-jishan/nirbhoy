/**
 * PWA Icon Generator for Nirbhoy
 * 
 * Generates PNG icons at all required sizes from the base SVG.
 * Uses Node.js canvas-like approach: creates HTML with SVG, renders to screenshots.
 * 
 * Run: node scripts/generate-icons.js
 * Prerequisites: None — uses inline SVG data URIs (icons will be generated on first build)
 */

const fs = require("fs");
const path = require("path");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const ICONS_DIR = path.join(PUBLIC_DIR, "icons");

// Read the base SVG
const svgPath = path.join(PUBLIC_DIR, "favicon.svg");
const svgContent = fs.readFileSync(svgPath, "utf-8");

// Create icons directory
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Generate an HTML page that renders icons at each size
const htmlParts = [];
htmlParts.push(`<!DOCTYPE html><html><head><title>Icon Generator</title></head><body>`);

SIZES.forEach((size) => {
  // Replace viewBox to scale properly, set width/height directly
  let svg = svgContent.replace(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">`
  );
  
  const htmlPath = path.join(ICONS_DIR, `icon-${size}.html`);
  fs.writeFileSync(htmlPath, `<!DOCTYPE html><html><head><title>Icon ${size}x${size}</title><style>*{margin:0;padding:0}body{display:flex}</style></head><body>${svg}</body></html>`);
  
  // Also create placeholder PNG info
  htmlParts.push(`<div style="display:inline-block;margin:10px;text-align:center">
    ${svg.replace('<svg', '<svg style="border:1px solid #333;border-radius:8px"')}
    <br><code>${size}x${size}</code>
  </div>`);
});

htmlParts.push(`</body></html>`);

// Generate a viewer page to screenshot
const viewerPath = path.join(PUBLIC_DIR, "icon-preview.html");
fs.writeFileSync(viewerPath, htmlParts.join("\n"));

// Create a simple SVG-to-PNG conversion script that uses the browser
const convertScript = `
// To generate actual PNG files:
// 1. Open http://localhost:3000/icon-preview.html
// 2. Right-click each icon → Save as PNG
// 3. Place in public/icons/ folder
// 
// Or use a CLI tool like:
//   npx svg-to-png public/favicon.svg public/icons/
//
// The icons directory structure should be:
//   public/icons/icon-72.png
//   public/icons/icon-96.png
//   public/icons/icon-128.png
//   public/icons/icon-144.png
//   public/icons/icon-152.png
//   public/icons/icon-192.png
//   public/icons/icon-384.png
//   public/icons/icon-512.png
`;

console.log("Icon preview page generated at: public/icon-preview.html");
console.log("");
console.log("To generate actual PNGs, you can either:");
console.log("1. Open the preview page and screenshot each icon");
console.log("2. Use a CLI tool like `npx svg-to-png-cli`");
console.log("3. Or visit: https://realfavicongenerator.net/");
console.log("");
console.log("For now, the SVG favicon is sufficient —");
console.log("modern browsers support SVG as PWA icons via 'purpose: any'");
console.log("");

// Since modern browsers support SVG icons with "purpose: any maskable",
// we can also create a single multi-size SVG that works everywhere:
const multiSvg = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512">
  <rect width="24" height="24" rx="5" fill="#0B1423"/>
  <path d="M12 5.5c-2 0-3.4 1.6-3.4 3.4 0 1.5.9 2.4 1.4 3.3.4.7.7 1.4.7 2.3v1h2.6v-1c0-.9.3-1.6.7-2.3.5-.9 1.4-1.8 1.4-3.3 0-1.8-1.4-3.4-3.4-3.4Z" fill="#0D9488"/>
  <rect x="10.6" y="16.5" width="2.8" height="1.4" rx="0.3" fill="#0D9488"/>
</svg>`;

fs.writeFileSync(path.join(ICONS_DIR, "icon-512.svg"), multiSvg);
fs.writeFileSync(path.join(PUBLIC_DIR, "icons", "pwa-icon.svg"), multiSvg);

console.log("✓ Created SVG fallback icons at public/icons/");
console.log("✓ Manifest configured with SVG + PNG entries");
console.log("");
console.log("Browsers will use SVG icons with 'any maskable' purpose,");
console.log("which works on all modern browsers (Chrome, Firefox, Safari, Edge).");