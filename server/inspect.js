import { loadImage } from 'canvas';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(here, '..', 'my certificate.png');

loadImage(templatePath).then((img) => {
  console.log(`Image loaded successfully!`);
  console.log(`Width: ${img.width}`);
  console.log(`Height: ${img.height}`);
}).catch((err) => {
  console.error('Error loading image:', err);
});
