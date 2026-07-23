import { createCertificateFiles, safeFilename } from '../services/certificateService.js';
import { findStudentByRollNo } from '../services/supabaseClient.js';

/** POST /api/generate — validates student by roll_no in DB, then creates PNG + PDF certificate. */
export async function generateCertificate(req, res, next) {
  try {
    const rollNo = req.body.roll_no?.trim();
    console.log(`[1] Request received for roll_no: "${rollNo}"`);

    // ── 1. Verify student exists in the database ──────────────────────────────
    const student = await findStudentByRollNo(rollNo);

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

    const certificate = await createCertificateFiles({
      name: confirmedName,
      semester: confirmedSem,
    });

    console.log("[11] Send response");
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
    console.error("[generateCertificate] ERROR Caught:", error.message);
    if (error.stack) console.error(error.stack);
    
    return res.status(500).json({
      success: false,
      message: "An error occurred during certificate generation.",
      error: error.message,
      stack: error.stack || null,
      filename: error.fileName || 'unknown',
    });
  }
}
