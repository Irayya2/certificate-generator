import { useState, useEffect } from 'react';
import { SparklesIcon, ShieldCheckIcon, CpuChipIcon } from '@heroicons/react/24/outline';

const LOADING_STEPS = [
  'Verifying student registration record...',
  'Synthesizing high-res certificate template...',
  'Applying official seal & signature marks...',
  'Generating PDF document & download package...'
];

export default function DeveloperLoadingModal({ isOpen, studentName }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setProgress(10);
      return;
    }

    // Progress bar incremental animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return 95;
        return prev + Math.floor(Math.random() * 6) + 3;
      });
    }, 250);

    // Step message rotation
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1400);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="loading-overlay-backdrop" role="dialog" aria-modal="true" aria-label="Generating Certificate">
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

        {/* Top Header Tag */}
        <div className="dev-header-badge">
          <SparklesIcon className="h-4 w-4 text-amber-400 animate-pulse" />
          <span>DEVELOPED BY</span>
        </div>

        {/* Central Rotating Developer Image Container */}
        <div className="dev-avatar-stage">
          {/* Outer Pulsing Neon Ambient Glow */}
          <div className="glow-aura-pulse" />
          <div className="glow-aura-pulse glow-delay" />

          {/* SVG Orbit Radar Rings */}
          <svg className="orbit-svg" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="92" className="orbit-ring orbit-outer" />
            <circle cx="100" cy="100" r="82" className="orbit-ring orbit-dashed-cw" />
            <circle cx="100" cy="100" r="72" className="orbit-ring orbit-dashed-ccw" />
            <circle cx="100" cy="100" r="62" className="orbit-ring orbit-inner-dots" />
          </svg>

          {/* Conic Gradient Spinner Border */}
          <div className="conic-spinner-ring" />

          {/* Round Developer Image with Rotation */}
          <div className="round-avatar-wrapper">
            <img 
              src="/developer.png" 
              alt="Developer" 
              className="round-developer-img" 
            />
            {/* Shimmer Light Reflection Overlay */}
            <div className="avatar-shimmer" />
          </div>
        </div>

        {/* Developer Title / Subtitle */}
        <div className="dev-info">
          <h3 className="dev-name">System Creator</h3>
          <p className="dev-role">BCA Department · Certificate Engine</p>
        </div>

        {/* Loading Message & Target Student */}
        <div className="loading-status-box">
          <div className="generating-for">
            Generating Certificate for <strong className="student-highlight">{studentName || 'Student'}</strong>
          </div>

          {/* Animated Progress Bar */}
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}>
              <div className="progress-glow-head" />
            </div>
          </div>

          <div className="progress-meta">
            <span className="step-text animate-fade-in" key={currentStepIndex}>
              {LOADING_STEPS[currentStepIndex]}
            </span>
            <span className="progress-percentage">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
