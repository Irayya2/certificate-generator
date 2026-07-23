import { createCertificateFiles, safeFilename, logMemory } from '../services/certificateService.js';
import { findStudentByRollNo } from '../services/supabaseClient.js';

let isGenerating = false;

/** POST /api/generate — validates student by roll_no in DB, then creates PNG (and optional PDF) certificate. */
export async function generateCertificate(req, res, next) {
  // Requirement 5 & 6: Process only one certificate generation at a time. Reject concurrent requests with HTTP 429.
  if (isGenerating) {
    console.warn('[generateCertificate] 429 CONCURRENCY REJECT: Certificate generation already in progress.');
    return res.status(429).json({
      success: false,
      message: 'Certificate generation already in progress. Please try again in a few seconds.',
    });
  }

  isGenerating = true;
  logMemory('Controller Step 0: Lock acquired, start request');

  try {
    const rollNo = req.body.roll_no?.trim();
    console.log(`[1] Request received for roll_no: "${rollNo}"`);

    // ── 1. Verify student exists in the database ──────────────────────────────
    const student = await findStudentByRollNo(rollNo);
    logMemory('Controller Step 1: After Supabase student lookup');

    if (!student) {
      console.log(`[generateCertificate] Student with roll_no "${rollNo}" not found in DB.`);
      return res.status(404).json({
        success: false,
        studentNotFound: true,
        message: `Roll No. "${rollNo}" is not registered or did not attend the workshop. Please check your roll number and try again.`,
      });
    }

    console.log(`[2] Student found in Supabase: ${student.full_name}, Roll: ${student.roll_no}, Sem: ${student.sem}`);

    // ── 2. Use DB-confirmed name and semester for the certificate ─────────────
    const confirmedName = student.full_name;
    const confirmedSem = student.sem;
    const generatePdf = req.body.generate_pdf === true || req.body.generatePdf === true;

    const certificate = await createCertificateFiles({
      name: confirmedName,
      semester: confirmedSem,
      generatePdf,
    });

    logMemory('Controller Step 2: After createCertificateFiles execution');

    console.log('[11] Send response');
    return res.status(201).json({
      success: true,
      message: 'Your certificate is ready to download.',
      data: {
        ...certificate,
        name: confirmedName,
        semester: confirmedSem,
        pngUrl: `/generated/${certificate.pngFilename}`,
        pdfUrl: `/generated/${certificate.pdfFilename}`,
        pngDownloadUrl: `/downloads/${certificate.pngFilename}`,
        pdfDownloadUrl: `/downloads/${certificate.pdfFilename}`,
        filename: `Certificate_${safeFilename(confirmedName)}`,
      },
    });
  } catch (error) {
    console.error('[generateCertificate] ERROR Caught:', error.message);
    if (error.stack) console.error(error.stack);

    return res.status(500).json({
      success: false,
      message: 'An error occurred during certificate generation.',
      error: error.message,
      stack: error.stack || null,
      filename: error.fileName || 'unknown',
    });
  } finally {
    // Release concurrency lock & invoke GC if node flag --expose-gc is set
    isGenerating = false;
    global.gc?.();
    logMemory('Controller Step 3: Lock released & GC executed');
  }
}

