import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from 'canvas';
import { PDFDocument } from 'pdf-lib';

const here        = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.join(here, '..', 'generated');
const templatePath = path.join(here, '..', '..', 'my certificate.png');

export const safeFilename = (v) =>
  v.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 80) || 'Recipient';

/**
 * Text placement coordinates for the Gogte College BCA certificate template.
 * Template dimensions: 6250 × 4419 px
 *
 * To re-calibrate: run `node draw_grid.js` and inspect grid.png.
 *
 * ┌── Blank locations (from visual inspection of grid.png) ──────────────────┐
 *  "Mr./Ms. ___________"  underline ≈  x:700→5050,  y≈2560
 *  "Of BCA _____ Sem"     blank     ≈  x:870→1720,  y≈2980
 * └──────────────────────────────────────────────────────────────────────────┘
 */
export const FIELD = {
  NAME: {
    // Center of the name underline area (between x: 1800 and 5200)
    x:           3500,
    y:           2565,   // Baseline sitting 15px above the underline at 2580
    maxWidth:    3200,   // Safe width to prevent overlapping Mr./Ms. or overflowing
    maxFontSize: 150,
    minFontSize: 80,
    font:        'bold serif',
    color:       '#1a0f0f',
    align:       'center',
    baseline:    'alphabetic',
  },
  SEMESTER: {
    // Center of the blank between "Of BCA" and "Sem" (between x: 1780 and 2510)
    x:           2145,
    y:           2975,   // Baseline sitting 15px above the underline at 2990
    maxWidth:    500,
    maxFontSize: 130,
    minFontSize: 60,
    font:        'bold serif',
    color:       '#1a0f0f',
    align:       'center',
    baseline:    'alphabetic',
  },
};

/**
 * Reduce font size until text fits within maxWidth.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {{ font: string, maxFontSize: number, minFontSize: number, maxWidth: number }} cfg
 */
function fittedFont(ctx, text, cfg) {
  let size = cfg.maxFontSize;
  while (size > cfg.minFontSize) {
    ctx.font = `${cfg.font.includes('bold') ? 'bold ' : ''}${size}px ${cfg.font.replace(/bold\s*/i, '')}`;
    if (ctx.measureText(text).width <= cfg.maxWidth) break;
    size -= 4;
  }
  ctx.font = `${cfg.font.includes('bold') ? 'bold ' : ''}${size}px ${cfg.font.replace(/bold\s*/i, '')}`;
}

/**
 * Generate PNG + PDF certificate files from the template.
 * @param {{ name: string, semester: number|string }} param0
 * @returns {Promise<{ id: string, pngFilename: string, pdfFilename: string }>}
 */
export async function createCertificateFiles({ name, semester }) {
  // Ensure output directory exists
  await fs.mkdir(generatedDir, { recursive: true });

  // ── 1. Load template ────────────────────────────────────────────────────────
  console.log(`[3] Loading template: ${templatePath}`);
  try {
    await fs.access(templatePath);
  } catch {
    throw new Error(`Template file not found at: ${templatePath}`);
  }
  const template = await loadImage(templatePath);

  // ── 2. Draw on canvas ───────────────────────────────────────────────────────
  console.log(`[4] Drawing certificate for "${name}", semester "${semester}"`);
  const canvas = createCanvas(template.width, template.height);
  const ctx    = canvas.getContext('2d');
  ctx.drawImage(template, 0, 0);

  // Name
  const nameCfg = FIELD.NAME;
  ctx.textAlign    = nameCfg.align;
  ctx.textBaseline = nameCfg.baseline || 'alphabetic';
  ctx.fillStyle    = nameCfg.color;
  fittedFont(ctx, name, nameCfg);
  ctx.fillText(name, nameCfg.x, nameCfg.y);

  // Semester
  if (semester !== undefined && semester !== null && String(semester).trim() !== '') {
    const semText = String(semester);
    const semCfg  = FIELD.SEMESTER;
    ctx.textAlign    = semCfg.align;
    ctx.textBaseline = semCfg.baseline || 'alphabetic';
    ctx.fillStyle    = semCfg.color;
    fittedFont(ctx, semText, semCfg);
    ctx.fillText(semText, semCfg.x, semCfg.y);
  }

  const base        = `Certificate_${safeFilename(name)}`;
  const pngFilename = `${base}.png`;
  const pdfFilename = `${base}.pdf`;
  const pngPath     = path.join(generatedDir, pngFilename);
  const pdfPath     = path.join(generatedDir, pdfFilename);

  // ── 3. Export PNG ───────────────────────────────────────────────────────────
  console.log(`[5] Exporting PNG`);
  const pngBuffer = canvas.toBuffer('image/png');
  console.log(`    PNG buffer: ${pngBuffer.length} bytes`);
  await fs.writeFile(pngPath, pngBuffer);
  console.log(`    PNG saved: ${pngPath}`);

  // ── 4. Generate PDF ─────────────────────────────────────────────────────────
  console.log(`[6] Generating PDF`);
    try {
      const logMem = (step) => {
        const mem = process.memoryUsage();
        console.log(`    [MEM] ${step} - RSS: ${Math.round(mem.rss / 1024 / 1024)}MB, HeapTotal: ${Math.round(mem.heapTotal / 1024 / 1024)}MB, HeapUsed: ${Math.round(mem.heapUsed / 1024 / 1024)}MB, Ext: ${Math.round(mem.external / 1024 / 1024)}MB`);
      };

      console.log(`    PNG buffer length: ${pngBuffer.length} bytes`);
      console.log(`    Image width: ${canvas.width}`);
      console.log(`    Image height: ${canvas.height}`);

      logMem('Before PDFDocument.create()');
      console.log(`    [9.1] PDFDocument.create() START`);
      const pdfDoc = await PDFDocument.create();
      console.log(`    [9.1] PDFDocument.create() END`);
      
      // Convert to JPEG before embedding to save memory and avoid pdf-lib embedPng() OOM crash
      logMem('Before JPEG conversion');
      console.log(`    Converting to JPEG for memory-efficient PDF embedding...`);
      const jpegBuffer = canvas.toBuffer('image/jpeg', { quality: 0.85 });
      console.log(`    JPEG buffer length: ${jpegBuffer.length} bytes`);
      
      logMem('Before embed');
      console.log(`    [9.2] pdfDoc.embedJpg(jpegBuffer) START`);
      const pdfImg = await pdfDoc.embedJpg(jpegBuffer);
      console.log(`    [9.2] pdfDoc.embedJpg(jpegBuffer) END`);
      
      logMem('Before addPage');
      console.log(`    [9.3] pdfDoc.addPage() START`);
      const page = pdfDoc.addPage([pdfImg.width, pdfImg.height]);
      console.log(`    [9.3] pdfDoc.addPage() END`);
      
      logMem('Before drawImage');
      console.log(`    [9.4] page.drawImage() START`);
      page.drawImage(pdfImg, { x: 0, y: 0, width: pdfImg.width, height: pdfImg.height });
      console.log(`    [9.4] page.drawImage() END`);
      
      logMem('Before pdfDoc.save()');
      console.log(`    [9.5] pdfDoc.save() START`);
      const pdfBytes = await pdfDoc.save();
      console.log(`    [9.5] pdfDoc.save() END`);
      console.log(`    PDF buffer created, length: ${pdfBytes.length} bytes`);
      
      logMem('Before fs.writeFile()');
      console.log(`    [9.6] fs.writeFile() START`);
      await fs.writeFile(pdfPath, pdfBytes);
      console.log(`    [9.6] fs.writeFile() END`);
      
      logMem('After PDF generated');
    } catch (pdfError) {
      console.error(`[9] PDF Generation Failed:`, pdfError.message);
      if (pdfError.stack) console.error(pdfError.stack);
    }

  // ── 5. Return file info ─────────────────────────────────────────────────────
  const id = `${base}-${Date.now()}`;
  console.log(`[7] Certificate files ready: ${pngFilename}, ${pdfFilename}`);
  return { id, pngFilename, pdfFilename };
}
