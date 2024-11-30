const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Use the existing textor-ai.png as the source
const sourceImage = path.join(__dirname, '../public/textor-ai.png');

// Generate different sized icons
const sizes = [192, 512];

Promise.all(
  sizes.map(size => {
    return sharp(sourceImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 79, g: 70, b: 229, alpha: 1 } // Indigo color matching your theme
      })
      .toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`));
  })
).then(() => {
  console.log(' PWA icons generated successfully');
}).catch(err => {
  console.error(' Error generating PWA icons:', err);
});
