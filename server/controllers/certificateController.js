import { createCertificateFiles, safeFilename } from '../services/certificateService.js';

/** POST /api/generate — creates PNG and PDF versions of a certificate. */
export async function generateCertificate(req, res, next) {
  try {
    const name = req.body.name.trim();
    const certificate = await createCertificateFiles({ name });
    return res.status(201).json({
      success: true,
      message: 'Your certificate is ready to download.',
      data: {
        ...certificate,
        name,
        pngUrl: `/generated/${certificate.pngFilename}`,
        pdfUrl: `/generated/${certificate.pdfFilename}`,
        pngDownloadUrl: `/downloads/${certificate.pngFilename}`,
        pdfDownloadUrl: `/downloads/${certificate.pdfFilename}`,
        filename: `CodeZone_Certificate_${safeFilename(name)}`,
      },
    });
  } catch (error) {
    next(error);
  }
}
