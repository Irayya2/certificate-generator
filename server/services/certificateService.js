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
  try {
    // Top-level constants 'generatedDir' and 'templatePath' are used.
    
    console.log(`[3] Template image path: ${templatePath}`);
    console.log(`    Generated dir path: ${generatedDir}`);
    
    // [4] Check if template file exists
    console.log(`[4] Check if template file exists`);
    try {
      await fs.access(templatePath);
    } catch (e) {
      throw new Error(`Template file does not exist at ${templatePath}`);
    }
    
    // Ensure output directory exists
    await fs.mkdir(generatedDir, { recursive: true });

    // [5] Load image
    console.log(`[5] Load image`);
    const template = await loadImage(templatePath);

    // [6] Create canvas
    console.log(`[6] Create canvas`);
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');

    // [7] Draw certificate
    console.log(`[7] Draw certificate`);
    ctx.drawImage(template, 0, 0);

    const nameCfg = FIELD.NAME;
    ctx.textAlign    = nameCfg.align;
    ctx.textBaseline = nameCfg.baseline || 'middle';
    ctx.fillStyle    = nameCfg.color;
    fittedFont(ctx, name, nameCfg);
    ctx.fillText(name, nameCfg.x, nameCfg.y);

    if (semester !== undefined && semester !== null && String(semester).trim() !== '') {
      const semText = String(semester);
      const semCfg  = FIELD.SEMESTER;
      ctx.textAlign    = semCfg.align;
      ctx.textBaseline = semCfg.baseline || 'middle';
      ctx.fillStyle    = semCfg.color;
      fittedFont(ctx, semText, semCfg);
      ctx.fillText(semText, semCfg.x, semCfg.y);
    }

    const base        = `Certificate_${safeFilename(name)}`;
    const pngFilename = `${base}.png`;
    const pdfFilename = `${base}.pdf`;
    const pngPath     = path.join(generatedDir, pngFilename);
    const pdfPath     = path.join(generatedDir, pdfFilename);

    // [8] Export PNG
    console.log(`[8] Export PNG`);
    const pngBuffer = canvas.toBuffer('image/png');
    console.log(`    PNG buffer created, length: ${pngBuffer.length} bytes`);
    await fs.writeFile(pngPath, pngBuffer);
    console.log(`    PNG file written to: ${pngPath}`);

    // [9] Generate PDF (TEMPORARILY DISABLED FOR CRASH ISOLATION)
    console.log(`[9] Generate PDF - Starting PDF generation trace`);
    
    /* 
    // Commented out to prevent the 502 OOM / Segfault crash on Render.
    // If the API succeeds without this block, pdf-lib is the confirmed cause.
    try {
      console.log(`    [9.1] PDFDocument.create()`);
      const pdfDoc = await PDFDocument.create();
      
      console.log(`    [9.2] pdfDoc.embedPng(pngBuffer)`);
      const pdfImg = await pdfDoc.embedPng(pngBuffer);
      
      console.log(`    [9.3] pdfDoc.addPage()`);
      const page = pdfDoc.addPage([pdfImg.width, pdfImg.height]);
      
      console.log(`    [9.4] page.drawImage()`);
      page.drawImage(pdfImg, { x: 0, y: 0, width: pdfImg.width, height: pdfImg.height });
      
      console.log(`    [9.5] pdfDoc.save()`);
      const pdfBytes = await pdfDoc.save();
      console.log(`    PDF buffer created, length: ${pdfBytes.length} bytes`);
      
      console.log(`    [9.6] fs.writeFile()`);
      await fs.writeFile(pdfPath, pdfBytes);
    } catch (pdfError) {
      console.error(`[9] PDF Generation Failed:`, pdfError.message);
      if (pdfError.stack) console.error(pdfError.stack);
      // We could throw here, but we are disabling it entirely.
    }
    */
    
    console.log(`    [9.7] PDF generation skipped for crash isolation.`);

    // [10] Save files
    console.log(`[10] Save files`);
    // Already written to disk above, just confirming successful save
    console.log(`    Files saved at: ${pngPath}, (PDF SKIPPED)`);

    const id = `${base}-${Date.now()}`;
    return { id, pngFilename, pdfFilename: null }; // Returning null for PDF to avoid broken links
  } catch (error) {
    console.error(`[createCertificateFiles] ERROR:`, error.message);
    if (error.stack) console.error(error.stack);
    throw error;
  }
}
