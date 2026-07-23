import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { generateCertificate } from '../services/certificateService';

const INITIAL_FORM = { rollNo: '' };

/** Plays the error sound once. Silently ignores browsers that block autoplay. */
function playErrorSound() {
  try {
    const audio = new Audio('/error-sound.mpeg');
    audio.volume = 1.0;
    audio.play().catch(() => {
      // Autoplay blocked — ignore silently
    });
  } catch {
    // Audio API not available — ignore
  }
}

export function useCertificateForm() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [isStudentNotFound, setIsStudentNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [buttonState, setButtonState] = useState('idle'); // 'idle' | 'generating' | 'success'
  const [certificate, setCertificate] = useState(null);

  const handleChange = useCallback((event) => {
    setFormData({ rollNo: event.target.value });
    if (error) {
      setError('');
      setIsStudentNotFound(false);
    }
  }, [error]);

  const handleSubmit = useCallback(async (event) => {
    if (event) event.preventDefault();

    // Requirement 2: Guard against duplicate requests while loading or in generating state
    if (isLoading || buttonState === 'generating') return;

    const rollNo = formData.rollNo.trim();

    if (!rollNo) {
      const message = 'Please enter your roll number to continue.';
      setError(message);
      setIsStudentNotFound(false);
      toast.error(message);
      return;
    }

    // Requirement 1: Immediately after first click, set generating state
    setIsLoading(true);
    setButtonState('generating');
    setError('');
    setIsStudentNotFound(false);

    try {
      // Dispatch single POST /api/generate request
      const body = await generateCertificate({ roll_no: rollNo });

      const certificateData = body?.data;
      if (!certificateData) {
        throw new Error(`Unexpected response shape from server.`);
      }

      setCertificate(certificateData);
      setFormData({ rollNo });

      // Requirement 3: After success, change button text to "Certificate Generated ✓" & color to green for 2s
      setButtonState('success');
      toast.success('Certificate generated successfully.');

      setTimeout(() => {
        setButtonState('idle');
      }, 2000);
    } catch (requestError) {
      console.error('[useCertificateForm] handleSubmit error:', requestError);

      // Requirement 4: Display actual backend error message instead of generic message
      const message =
        requestError.response?.data?.message ||
        requestError.response?.data?.error ||
        requestError.message ||
        'We could not generate your certificate. Please try again.';
      const notFound = requestError.studentNotFound === true;

      setError(message);
      setIsStudentNotFound(notFound);
      setButtonState('idle');

      if (notFound) {
        playErrorSound();
        toast.error(message, { duration: 5000, icon: '🚫' });
      } else {
        toast.error(message);
      }
    } finally {
      // Requirement 11: Ensure loading state is cleared in finally{} even if an exception occurs
      setIsLoading(false);
    }
  }, [formData, isLoading, buttonState]);

  return {
    formData,
    error,
    isStudentNotFound,
    isLoading,
    buttonState,
    certificate,
    handleChange,
    handleSubmit
  };
}
