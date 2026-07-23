import { useState, useRef, useEffect } from 'react';
import { ArrowDownTrayIcon, CheckCircleIcon, DocumentArrowDownIcon, SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useCertificateForm } from '../hooks/useCertificateForm';
import { API_ORIGIN } from '../services/certificateService';
import DeveloperLoadingModal from '../components/DeveloperLoadingModal';
import Spinner from '../components/Spinner';

function DownloadButton({ href, filename, type, icon: Icon }) {
  const [downloading, setDownloading] = useState(false);
  const download = () => {
    setDownloading(true);
    window.setTimeout(() => setDownloading(false), 900);
  };
  return (
    <a className="download-button" href={`${API_ORIGIN}${href}`} download={filename} onClick={download}>
      <Icon className="h-5 w-5" />
      {downloading ? 'Preparing download…' : `Download ${type}`}
    </a>
  );
}

/** Shown when the student's roll number was not found in the database. */
function NotRegisteredBanner({ rollNo }) {
  return (
    <div className="not-registered-banner" role="alert" aria-live="assertive">
      <div className="not-registered-icon">
        <ExclamationTriangleIcon className="h-8 w-8" />
      </div>
      <div className="not-registered-body">
        <strong>Roll Number Not Registered</strong>
        <p>
          Roll No. <span className="not-registered-name">"{rollNo}"</span> was not found in our workshop attendance records.
        </p>
        <ul className="not-registered-hints">
          <li>Double-check your roll number for any typos.</li>
          <li>Try your roll number exactly as provided during registration.</li>
          <li>Contact the coordinator if you believe this is an error.</li>
        </ul>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { formData, error, isStudentNotFound, isLoading, buttonState, certificate, handleChange, handleSubmit } = useCertificateForm();
  const imageUrl = certificate ? `${API_ORIGIN}${certificate.pngUrl}` : null;
  const previewRef = useRef(null);

  // Requirement 7: Automatically scroll to the generated certificate preview after success
  useEffect(() => {
    if (certificate && previewRef.current) {
      const timer = setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [certificate]);

  const isFormDisabled = isLoading || buttonState === 'generating';

  return (
    <div className="app-shell">
      {/* Requirement 5 & 6: Loading overlay & progress indicator */}
      <DeveloperLoadingModal isOpen={isLoading} studentName={formData.rollNo} />

      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <main className="page-wrap">
        <nav className="brand" aria-label="Gogte College BCA">
          <span className="brand-mark">🎓</span>
          <div className="brand-text-block">
            <span className="brand-college">Gogte College of Commerce</span>
            <span className="brand-dept">BCA Department</span>
          </div>
          <span className="brand-label">CERTIFY</span>
        </nav>

        <section className="hero-copy">
          <div className="eyebrow"><SparklesIcon className="h-4 w-4" /> FILM MAKING WORKSHOP 2026–27</div>
          <h1>Certificate<br /><em>Generator.</em></h1>
          
          {/* Workshop Event Banner */}
          <div className="banner-card-frame">
            <img src="/banner-poster.png" alt="Filmmaking Workshop 2026 Poster" className="banner-poster-img" />
            <div className="banner-badge-overlay">
              <SparklesIcon className="h-3.5 w-3.5" /> Event Poster
            </div>
          </div>

          <p className="hero-desc">Generate your <strong>Certificate of Appreciation</strong> for attending the Film Making Workshop — issued by the BCA Department, Gogte College of Commerce, Belgaum.</p>
          <div className="hero-badges">
            <span className="badge">NAAC A Grade</span>
            <span className="badge">IQAC &amp; IIC</span>
            <span className="badge">2026–27</span>
          </div>
        </section>

        <section className="generator-card">
          <div className="card-header">
            <span className="step-number">01</span>
            <div>
              <h2>Generate your certificate</h2>
              <p>Enter your roll number exactly as registered in the database.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="roll_no">Roll Number <span>*</span></label>
            <div className={`input-wrap ${error && !isStudentNotFound ? 'has-error' : ''} ${isStudentNotFound ? 'has-error not-found-input' : ''}`}>
              {/* Requirement 8: Disable form fields while generating */}
              <input
                id="roll_no"
                name="roll_no"
                value={formData.rollNo}
                onChange={handleChange}
                placeholder="e.g. BCA2301"
                maxLength="20"
                autoComplete="off"
                disabled={isFormDisabled}
              />
              <span className="input-caret">↗</span>
            </div>

            {/* Requirement 4: Display actual backend error message */}
            {error && !isStudentNotFound && (
              <p className="field-error" role="alert">{error}</p>
            )}

            {/* Requirement 1, 2, 3, 10: Button states, loading spinner, colors, and 300ms transitions */}
            <button
              className={`generate-button ${buttonState}`}
              type="submit"
              disabled={isFormDisabled || buttonState === 'success'}
            >
              {buttonState === 'generating' || isLoading ? (
                <>
                  <Spinner size="sm" color="currentColor" />
                  Generating...
                </>
              ) : buttonState === 'success' ? (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  Certificate Generated ✓
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  Generate Certificate
                </>
              )}
            </button>
          </form>

          {/* Student not registered — special banner */}
          {isStudentNotFound && (
            <NotRegisteredBanner rollNo={formData.rollNo.trim()} />
          )}

          <p className="privacy-note">Your information is only used to create this certificate.</p>
        </section>

        <section
          ref={previewRef}
          className={`preview-section ${certificate ? 'is-visible' : ''}`}
          aria-live="polite"
        >
          {certificate ? (
            <>
              {/* Requirement 9: Success animation badge */}
              <div className="certificate-ready-badge">
                <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                <span>✓ Certificate Ready!</span>
              </div>
              <div className="success-line">Certificate issued to <strong>{certificate.name}</strong></div>
              <div className="preview-frame">
                <img src={imageUrl} alt={`Certificate awarded to ${certificate.name}`} />
              </div>
              <div className="download-grid">
                <DownloadButton
                  href={certificate.pngDownloadUrl}
                  filename={certificate.pngFilename}
                  type="PNG"
                  icon={ArrowDownTrayIcon}
                />
                <DownloadButton
                  href={certificate.pdfDownloadUrl}
                  filename={certificate.pdfFilename}
                  type="PDF"
                  icon={DocumentArrowDownIcon}
                />
              </div>
            </>
          ) : (
            <div className="preview-placeholder">
              <div className="placeholder-icon">🎬</div>
              <div>
                <strong>Your certificate will appear here</strong>
                <span>Enter your roll number above and click Generate Certificate.</span>
              </div>
            </div>
          )}
        </section>
      </main>
      <footer>© {new Date().getFullYear()} · Gogte College of Commerce, BCA Department · Tilakwadi, Belgaum</footer>
    </div>
  );
}
