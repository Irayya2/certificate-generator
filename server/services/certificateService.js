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

/** Helper to log memory usage at key steps */
export function logMemory(step) {
  const mem = process.memoryUsage();
  console.log(
    `[MEM STATS] ${step.padEnd(42)} | RSS: ${Math.round(mem.rss / 1024 / 1024)}MB | HeapUsed: ${Math.round(mem.heapUsed / 1024 / 1024)}MB | HeapTotal: ${Math.round(mem.heapTotal / 1024 / 1024)}MB | External: ${Math.round(mem.external / 1024 / 1024)}MB`
  );
}

/**
 * Text placement coordinates for the Gogte College BCA certificate template.
 * Original template dimensions: 6250 × 4419 px
 */
export const FIELD = {
  NAME: {
    x:           3500,
    y:           2565,
    maxWidth:    3200,
    maxFontSize: 150,
    minFontSize: 80,
    font:        'bold serif',
    color:       '#1a0f0f',
    align:       'center',
    baseline:    'alphabetic',
  },
  SEMESTER: {
    x:           2145,
    y:           2975,
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
 * Convert PNG file to PDF file on demand.
 */
export async function convertPngToPdf(pngPath, pdfPath) {
  logMemory('PDF Step 1: Before reading PNG file');
  let pngBuffer = await fs.readFile(pngPath);
  logMemory('PDF Step 2: After reading PNG file');

  let pdfDoc = await PDFDocument.create();
  let pdfImg = await pdfDoc.embedPng(pngBuffer);
  pngBuffer = null; // Release PNG buffer immediately
  logMemory('PDF Step 3: After pdfDoc.embedPng');

  const page = pdfDoc.addPage([pdfImg.width, pdfImg.height]);
  page.drawImage(pdfImg, { x: 0, y: 0, width: pdfImg.width, height: pdfImg.height });
  pdfImg = null;

  logMemory('PDF Step 4: Before pdfDoc.save()');
  let pdfBytes = await pdfDoc.save();
  pdfDoc = null; // Release PDFDocument instance
  logMemory('PDF Step 5: After pdfDoc.save()');

  await fs.writeFile(pdfPath, pdfBytes);
  pdfBytes = null; // Release PDF byte buffer
  logMemory('PDF Step 6: After saving PDF file');

  global.gc?.();
}

/**
 * Generate PNG (and optionally PDF) certificate files from the template.
 * Target canvas resolution: 2480 × 1754 (A4 @ ~200 DPI), scaled down from 6250 × 4419.
 * Memory optimization: ~17.4 MB raw canvas buffer vs ~110.5 MB original.
 */
export async function createCertificateFiles({ name, semester, generatePdf = false }) {
  logMemory('Step 0: Start certificate generation');

  await fs.mkdir(generatedDir, { recursive: true });

  const base        = `Certificate_${safeFilename(name)}`;
  const pngFilename = `${base}.png`;
  const pdfFilename = `${base}.pdf`;
  const pngPath     = path.join(generatedDir, pngFilename);
  const pdfPath     = path.join(generatedDir, pdfFilename);

  // Target resolution: approximately 2480 × 1754
  const ORIGINAL_WIDTH  = 6250;
  const ORIGINAL_HEIGHT = 4419;
  const TARGET_WIDTH    = 2480;
  const TARGET_HEIGHT   = 1754;

  const scaleX = TARGET_WIDTH / ORIGINAL_WIDTH;
  const scaleY = TARGET_HEIGHT / ORIGINAL_HEIGHT;

  // 1. Load template
  logMemory('Step 1: Before loading template image');
  try {
    await fs.access(templatePath);
  } catch {
    throw new Error(`Template file not found at: ${templatePath}`);
  }
  let template = await loadImage(templatePath);
  logMemory('Step 2: After loading template image');

  // 2. Draw on canvas
  let canvas = createCanvas(TARGET_WIDTH, TARGET_HEIGHT);
  let ctx    = canvas.getContext('2d');
  ctx.drawImage(template, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

  // Immediately release image reference
  template = null;
  logMemory('Step 3: After drawImage & releasing template image reference');

  // Name
  const nameCfg = {
    ...FIELD.NAME,
    x: FIELD.NAME.x * scaleX,
    y: FIELD.NAME.y * scaleY,
    maxWidth: FIELD.NAME.maxWidth * scaleX,
    maxFontSize: Math.round(FIELD.NAME.maxFontSize * scaleX),
    minFontSize: Math.round(FIELD.NAME.minFontSize * scaleX),
  };
  ctx.textAlign    = nameCfg.align;
  ctx.textBaseline = nameCfg.baseline || 'alphabetic';
  ctx.fillStyle    = nameCfg.color;
  fittedFont(ctx, name, nameCfg);
  ctx.fillText(name, nameCfg.x, nameCfg.y);

  // Semester
  if (semester !== undefined && semester !== null && String(semester).trim() !== '') {
    const semText = String(semester);
    const semCfg  = {
      ...FIELD.SEMESTER,
      x: FIELD.SEMESTER.x * scaleX,
      y: FIELD.SEMESTER.y * scaleY,
      maxWidth: FIELD.SEMESTER.maxWidth * scaleX,
      maxFontSize: Math.round(FIELD.SEMESTER.maxFontSize * scaleX),
      minFontSize: Math.round(FIELD.SEMESTER.minFontSize * scaleX),
    };
    ctx.textAlign    = semCfg.align;
    ctx.textBaseline = semCfg.baseline || 'alphabetic';
    ctx.fillStyle    = semCfg.color;
    fittedFont(ctx, semText, semCfg);
    ctx.fillText(semText, semCfg.x, semCfg.y);
  }
  logMemory('Step 4: After drawing text elements');

  // 3. Export PNG
  let pngBuffer = canvas.toBuffer('image/png');
  logMemory('Step 5: After canvas.toBuffer(png)');

  await fs.writeFile(pngPath, pngBuffer);
  logMemory('Step 6: After fs.writeFile(png)');

  // 4. Generate PDF only if explicitly requested
  if (generatePdf) {
    console.log(`[createCertificateFiles] PDF requested explicitly — generating PDF`);
    await convertPngToPdf(pngPath, pdfPath);
  } else {
    console.log(`[createCertificateFiles] PDF optional — skipping PDF generation for speed & low RAM`);
  }

  // 5. Immediately release canvas, context, and buffer references
  pngBuffer = null;
  canvas    = null;
  ctx       = null;

  logMemory('Step 7: After releasing canvas, ctx, and buffer references');

  global.gc?.();
  logMemory('Step 8: After explicit global.gc?.() call');

  const id = `${base}-${Date.now()}`;
  return { id, pngFilename, pdfFilename, pdfGenerated: generatePdf };
}

