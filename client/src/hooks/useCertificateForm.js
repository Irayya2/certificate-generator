import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { generateCertificate } from '../services/certificateService';

const INITIAL_FORM = { name: '' };

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
  const [certificate, setCertificate] = useState(null);

  const handleChange = useCallback((event) => {
    setFormData({ name: event.target.value });
    if (error) {
      setError('');
      setIsStudentNotFound(false);
    }
  }, [error]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    const name = formData.name.trim();

    if (!name) {
      const message = 'Please enter your full name to continue.';
      setError(message);
      setIsStudentNotFound(false);
      toast.error(message);
      return;
    }

    setIsLoading(true);
    setError('');
    setIsStudentNotFound(false);
    try {
      const data = await generateCertificate({ name });
      setCertificate(data.data);
      setFormData({ name });
      toast.success('Certificate generated successfully.');
    } catch (requestError) {
      const message = requestError.message || 'We could not generate your certificate. Please try again.';
      const notFound = requestError.studentNotFound === true;

      setError(message);
      setIsStudentNotFound(notFound);

      if (notFound) {
        // Play the custom error sound for unregistered students
        playErrorSound();
        toast.error(message, { duration: 5000, icon: '🚫' });
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  return { formData, error, isStudentNotFound, isLoading, certificate, handleChange, handleSubmit };
}
