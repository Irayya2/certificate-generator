import { useState } from 'react';
import { ArrowDownTrayIcon, CheckCircleIcon, DocumentArrowDownIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useCertificateForm } from '../hooks/useCertificateForm';
import { API_ORIGIN } from '../services/certificateService';

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

export default function HomePage() {
  const { formData, error, isLoading, certificate, handleChange, handleSubmit } = useCertificateForm();
  const imageUrl = certificate ? `${API_ORIGIN}${certificate.pngUrl}?v=${certificate.id}` : null;

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <main className="page-wrap">
        <nav className="brand" aria-label="CodeZone home">
          <span className="brand-mark">&lt;/&gt;</span><span>code<span>zone</span></span>
          <span className="brand-label">CERTIFY</span>
        </nav>

        <section className="hero-copy">
          <div className="eyebrow"><SparklesIcon className="h-4 w-4" /> INSTANT CERTIFICATION</div>
          <h1>Certificate<br /><em>Generator.</em></h1>
          <p>Generate your participation certificate instantly — polished, verified, and ready to share.</p>
        </section>

        <section className="generator-card">
          <div className="card-header"><span className="step-number">01</span><div><h2>Create your certificate</h2><p>Enter your name exactly as it should appear.</p></div></div>
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="name">Full name <span>*</span></label>
            <div className={`input-wrap ${error ? 'has-error' : ''}`}>
              <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Alex Morgan" maxLength="120" autoComplete="name" />
              <span className="input-caret">↗</span>
            </div>
            {error && <p className="field-error" role="alert">{error}</p>}
            <button className="generate-button" type="submit" disabled={isLoading}>
              {isLoading ? <><span className="spinner" /> Generating Certificate…</> : <><SparklesIcon className="h-5 w-5" /> Generate Certificate</>}
            </button>
          </form>
          <p className="privacy-note">Your information is only used to create this certificate.</p>
        </section>

        <section className={`preview-section ${certificate ? 'is-visible' : ''}`} aria-live="polite">
          {certificate ? <>
            <div className="success-line"><CheckCircleIcon className="h-5 w-5" /> Certificate ready for {certificate.name}</div>
            <div className="preview-frame"><img src={imageUrl} alt={`Certificate awarded to ${certificate.name}`} /></div>
            <div className="download-grid">
              <DownloadButton href={certificate.pngDownloadUrl} filename={certificate.pngFilename} type="PNG" icon={ArrowDownTrayIcon} />
              <DownloadButton href={certificate.pdfDownloadUrl} filename={certificate.pdfFilename} type="PDF" icon={DocumentArrowDownIcon} />
            </div>
          </> : <div className="preview-placeholder"><div className="placeholder-icon">✦</div><div><strong>Your certificate will appear here</strong><span>Complete the form above to create a downloadable PNG or PDF.</span></div></div>}
        </section>
      </main>
      <footer>© {new Date().getFullYear()} CODEZONE · BUILT FOR GREAT WORK</footer>
    </div>
  );
}
