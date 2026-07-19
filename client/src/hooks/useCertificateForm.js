import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { generateCertificate } from '../services/certificateService';

const INITIAL_FORM = { name: '' };

export function useCertificateForm() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [certificate, setCertificate] = useState(null);

  const handleChange = useCallback((event) => {
    setFormData({ name: event.target.value });
    if (error) setError('');
  }, [error]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    const name = formData.name.trim();

    if (!name) {
      const message = 'Please enter your full name to continue.';
      setError(message);
      toast.error(message);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await generateCertificate({ name });
      setCertificate(data.data);
      setFormData({ name });
      toast.success('Certificate generated successfully.');
    } catch (requestError) {
      const message = requestError.message || 'We could not generate your certificate. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  return { formData, error, isLoading, certificate, handleChange, handleSubmit };
}
