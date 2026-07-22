import { createCanvas, loadImage } from 'canvas';
import fs from 'node:fs/promises';
import path from 'node:path';

const templatePath = 'd:/Projects/Certificate/my certificate.png';
const outputPath = path.join(path.dirname(new URL(import.meta.url).pathname.slice(1)), 'grid.png');

async function main() {
  const img = await loadImage(templatePath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  
  // Draw original image
  ctx.drawImage(img, 0, 0);
  
  // Draw grid
  ctx.lineWidth = 2;
  
  for (let x = 0; x < img.width; x += 100) {
    if (x % 500 === 0) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 4;
    } else {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.lineWidth = 1;
    }
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, img.height);
    ctx.stroke();
    
    if (x % 500 === 0) {
      ctx.fillStyle = 'red';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText(x.toString(), x + 10, 50);
      ctx.fillText(x.toString(), x + 10, img.height - 20);
    }
  }
  
  for (let y = 0; y < img.height; y += 100) {
    if (y % 500 === 0) {
      ctx.strokeStyle = 'rgba(0, 0, 255, 0.8)';
      ctx.lineWidth = 4;
    } else {
      ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)';
      ctx.lineWidth = 1;
    }
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(img.width, y);
    ctx.stroke();
    
    if (y % 500 === 0) {
      ctx.fillStyle = 'blue';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText(y.toString(), 10, y - 10);
      ctx.fillText(y.toString(), img.width - 120, y - 10);
    }
  }
  
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(outputPath, buffer);
  console.log(`Grid image written to ${outputPath}`);
}

main().catch(console.error);
