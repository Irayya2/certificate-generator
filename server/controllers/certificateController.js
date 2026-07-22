import { createCertificateFiles, safeFilename } from '../services/certificateService.js';
import { findStudentByName } from '../services/supabaseClient.js';

/** POST /api/generate — validates student in DB, then creates PNG + PDF certificate. */
export async function generateCertificate(req, res, next) {
  try {
    console.log("POST /api/generate reached");
    const name = req.body.name.trim();

    // ── 1. Verify student exists in the database ──────────────────────────────
    const student = await findStudentByName(name);

    if (!student) {
      return res.status(404).json({
        success: false,
        studentNotFound: true,
        message: `"${name}" is not registered or did not attend the workshop. Please check your name and try again.`,
      });
    }

    // ── 2. Use DB-confirmed name and semester for the certificate ─────────────
    const confirmedName = student.full_name;
    const confirmedSem = student.sem;

    const certificate = await createCertificateFiles({
      name: confirmedName,
      semester: confirmedSem,
    });

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
    next(error);
  }
}
