import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, loadImage } from 'canvas';
import { PDFDocument } from 'pdf-lib';

const here = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.join(here, '..', 'template');
const generatedDir = path.join(here, '..', 'generated');
const templatePath = path.join(templateDir, 'certificate.png');

export const safeFilename = (value) => value.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 80) || 'Recipient';

/**
 * Single source of truth for certificate field placement. Add a drawing step in
 * createCertificateFiles when a new field is enabled by the form/API.
 */
export const PLACEHOLDER_COORDINATES = {
  NAME: { x: 1000, y: 705, maxWidth: 1470, maxFontSize: 64, font: '700 64px sans-serif', color: '#123820' },
  COLLEGE: { x: 1000, y: 800, maxWidth: 1350, maxFontSize: 30, font: '400 30px sans-serif', color: '#4d6252' },
  EVENT: { x: 1000, y: 860, maxWidth: 1350, maxFontSize: 30, font: '400 30px sans-serif', color: '#4d6252' },
  DATE: { x: 300, y: 1180, maxWidth: 400, maxFontSize: 20, font: '400 20px sans-serif', color: '#617767' },
  CERTIFICATE_ID: { x: 1700, y: 1180, maxWidth: 400, maxFontSize: 20, font: '400 20px sans-serif', color: '#617767' },
};

async function ensureTemplate() {
  await fs.mkdir(templateDir, { recursive: true });
  try { await fs.access(templatePath); return; } catch { /* create branded fallback */ }
  const canvas = createCanvas(2000, 1414);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 2000, 1414);
  gradient.addColorStop(0, '#f9fff9'); gradient.addColorStop(1, '#e9f8ee');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 2000, 1414);
  ctx.strokeStyle = '#1b7a3c'; ctx.lineWidth = 18; ctx.strokeRect(46, 46, 1908, 1322);
  ctx.strokeStyle = '#8bcd9a'; ctx.lineWidth = 3; ctx.strokeRect(74, 74, 1852, 1266);
  ctx.fillStyle = '#156c35'; ctx.font = '700 38px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('CODEZONE', 1000, 208);
  ctx.fillStyle = '#17281b'; ctx.font = '700 88px serif'; ctx.fillText('Certificate of Participation', 1000, 360);
  ctx.fillStyle = '#4d6252'; ctx.font = '400 28px sans-serif'; ctx.fillText('This certificate is proudly presented to', 1000, 558);
  ctx.fillStyle = '#4d6252'; ctx.font = '400 28px sans-serif'; ctx.fillText('for participating in the CodeZone learning community.', 1000, 830);
  ctx.fillStyle = '#156c35'; ctx.fillRect(750, 751, 500, 3);
  ctx.textAlign = 'left'; ctx.font = '600 24px sans-serif'; ctx.fillText('CODEZONE', 205, 1135);
  ctx.font = '400 20px sans-serif'; ctx.fillStyle = '#617767'; ctx.fillText('Certificate Generator', 205, 1172);
  ctx.textAlign = 'right'; ctx.font = '600 24px sans-serif'; ctx.fillStyle = '#17281b'; ctx.fillText('Verified Certificate', 1795, 1135);
  ctx.font = '400 20px sans-serif'; ctx.fillStyle = '#617767'; ctx.fillText('Issued digitally by CodeZone', 1795, 1172);
  await fs.writeFile(templatePath, canvas.toBuffer('image/png'));
}

function fittedFont(ctx, text, config) {
  let size = config.maxFontSize;
  while (size > 26) {
    ctx.font = config.font.replace(/\d+px/, `${size}px`);
    if (ctx.measureText(text).width <= config.maxWidth) break;
    size -= 2;
  }
}

export async function createCertificateFiles({ name }) {
  await ensureTemplate();
  await fs.mkdir(generatedDir, { recursive: true });
  let template;
  try {
    template = await loadImage(templatePath);
  } catch (cause) {
    const error = new Error('The certificate template could not be loaded. Please contact the administrator.');
    error.statusCode = 500;
    error.cause = cause;
    throw error;
  }
  const canvas = createCanvas(template.width, template.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(template, 0, 0);
  const nameConfig = PLACEHOLDER_COORDINATES.NAME;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = nameConfig.color;
  fittedFont(ctx, name, nameConfig);
  ctx.fillText(name, nameConfig.x, nameConfig.y);
  // Required stable filenames: generating the same student again refreshes their files.
  const base = `CodeZone_Certificate_${safeFilename(name)}`;
  const pngFilename = `${base}.png`; const pdfFilename = `${base}.pdf`;
  const png = canvas.toBuffer('image/png');
  await fs.writeFile(path.join(generatedDir, pngFilename), png);
  const pdf = await PDFDocument.create();
  const image = await pdf.embedPng(png);
  const page = pdf.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  await fs.writeFile(path.join(generatedDir, pdfFilename), await pdf.save());
  return { id: `${base}-${Date.now()}`, pngFilename, pdfFilename };
}
