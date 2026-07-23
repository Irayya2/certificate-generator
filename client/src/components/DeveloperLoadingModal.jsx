import { useState, useEffect } from 'react';
import { SparklesIcon, ShieldCheckIcon, CpuChipIcon, CheckIcon } from '@heroicons/react/24/outline';

const PROGRESS_STEPS = [
  { id: 'validate', label: 'Validating student...' },
  { id: 'create', label: 'Creating certificate...' },
  { id: 'prepare', label: 'Preparing download...' }
];

export default function DeveloperLoadingModal({ isOpen, studentName }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setProgress(15);
      return;
    }

    // Smooth overall progress bar advancement
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 95;
        return prev + Math.floor(Math.random() * 5) + 3;
      });
    }, 200);

    // Step progress transitions: 0 -> 1 -> 2
    const step1Timer = setTimeout(() => setCurrentStepIndex(1), 1400);
    const step2Timer = setTimeout(() => setCurrentStepIndex(2), 3200);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(step1Timer);
      clearTimeout(step2Timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="loading-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Generating Certificate"
    >
      <div className="loading-modal-card">
        {/* Corner HUD accent elements */}
        <div className="hud-corner hud-top-left" />
        <div className="hud-corner hud-top-right" />
        <div className="hud-corner hud-bottom-left" />
        <div className="hud-corner hud-bottom-right" />

        {/* Floating cyber badges */}
        <div className="cyber-badge badge-top-right">
          <CpuChipIcon className="h-3.5 w-3.5" /> CERT-ENGINE v2.4
        </div>
        <div className="cyber-badge badge-bottom-left">
          <ShieldCheckIcon className="h-3.5 w-3.5" /> ENCRYPTED PIPELINE
        </div>

        {/* Header Badge */}
        <div className="dev-header-badge">
          <SparklesIcon className="h-4 w-4 text-amber-400 animate-pulse" />
          <span>DEVELOPED BY BCA DEPT</span>
        </div>

        {/* Rotating Avatar Visual Stage */}
        <div className="dev-avatar-stage">
          <div className="glow-aura-pulse" />
          <div className="glow-aura-pulse glow-delay" />

          <svg className="orbit-svg" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="92" className="orbit-ring orbit-outer" />
            <circle cx="100" cy="100" r="82" className="orbit-ring orbit-dashed-cw" />
            <circle cx="100" cy="100" r="72" className="orbit-ring orbit-dashed-ccw" />
            <circle cx="100" cy="100" r="62" className="orbit-ring orbit-inner-dots" />
          </svg>

          <div className="conic-spinner-ring" />

          <div className="round-avatar-wrapper">
            <img 
              src="/developer.png" 
              alt="Developer" 
              className="round-developer-img" 
            />
            <div className="avatar-shimmer" />
          </div>
        </div>

        {/* Requirement 5: Overlay title and estimated time notice */}
        <div className="modal-title-block">
          <h2 className="loading-modal-title">Generating your certificate...</h2>
          <p className="loading-modal-subtitle">
            <span className="hourglass-icon">⏳</span> Please wait 5–10 seconds.
          </p>
        </div>

        {/* Loading Status Box with Progress Bar & Step Indicators */}
        <div className="loading-status-box">
          {studentName && (
            <div className="generating-for">
              Roll No: <strong className="student-highlight">{studentName}</strong>
            </div>
          )}

          {/* Animated Progress Bar */}
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}>
              <div className="progress-glow-head" />
            </div>
          </div>

          {/* Requirement 6: Step Progress Indicator */}
          <div className="steps-container">
            {PROGRESS_STEPS.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isActive = idx === currentStepIndex;
              const isPending = idx > currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`step-item ${
                    isCompleted ? 'step-completed' : isActive ? 'step-active' : 'step-pending'
                  }`}
                >
                  <span className="step-status-icon">
                    {isCompleted ? (
                      <span className="check-mark">✓</span>
                    ) : isActive ? (
                      <span className="spinner-icon">⏳</span>
                    ) : (
                      <span className="dot-icon">○</span>
                    )}
                  </span>
                  <span className="step-label">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
