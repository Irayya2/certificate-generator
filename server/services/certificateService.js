import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage, registerFont } from 'canvas';
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
  await fs.mkdir(generatedDir, { recursive: true });

  // ── Load the template ─────────────────────────────────────────────────────
  let template;
  try {
    template = await loadImage(templatePath);
  } catch (cause) {
    const error = new Error(
      'The certificate template could not be loaded. ' +
      'Ensure "my certificate.png" exists in the project root.'
    );
    error.statusCode = 500;
    error.cause = cause;
    throw error;
  }

  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext('2d');

  // ── Draw template ─────────────────────────────────────────────────────────
  ctx.drawImage(template, 0, 0);

  // ── Draw student name ─────────────────────────────────────────────────────
  const nameCfg = FIELD.NAME;
  ctx.textAlign    = nameCfg.align;
  ctx.textBaseline = nameCfg.baseline || 'middle';
  ctx.fillStyle    = nameCfg.color;
  fittedFont(ctx, name, nameCfg);
  ctx.fillText(name, nameCfg.x, nameCfg.y);

  // ── Draw semester number ──────────────────────────────────────────────────
  if (semester !== undefined && semester !== null && String(semester).trim() !== '') {
    const semText = String(semester);
    const semCfg  = FIELD.SEMESTER;
    ctx.textAlign    = semCfg.align;
    ctx.textBaseline = semCfg.baseline || 'middle';
    ctx.fillStyle    = semCfg.color;
    fittedFont(ctx, semText, semCfg);
    ctx.fillText(semText, semCfg.x, semCfg.y);
  }

  // ── Save PNG ──────────────────────────────────────────────────────────────
  const base        = `Certificate_${safeFilename(name)}`;
  const pngFilename = `${base}.png`;
  const pdfFilename = `${base}.pdf`;
  const pngBuffer   = canvas.toBuffer('image/png');
  await fs.writeFile(path.join(generatedDir, pngFilename), pngBuffer);

  // ── Save PDF ──────────────────────────────────────────────────────────────
  const pdfDoc = await PDFDocument.create();
  const pdfImg = await pdfDoc.embedPng(pngBuffer);
  const page   = pdfDoc.addPage([pdfImg.width, pdfImg.height]);
  page.drawImage(pdfImg, { x: 0, y: 0, width: pdfImg.width, height: pdfImg.height });
  await fs.writeFile(path.join(generatedDir, pdfFilename), await pdfDoc.save());

  const id = `${base}-${Date.now()}`;
  console.log(`[Certificate] Generated: ${pngFilename} | ${pdfFilename}`);
  return { id, pngFilename, pdfFilename };
}
