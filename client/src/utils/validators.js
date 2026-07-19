/**
 * Validation utility functions for the Certificate Generator form.
 */

/**
 * Validates that a value is not empty/whitespace.
 * @param {string} value
 * @param {string} fieldName
 * @returns {string|null} Error message or null if valid
 */
export function validateRequired(value, fieldName = 'This field') {
  if (!value || value.toString().trim() === '') {
    return `${fieldName} is required.`;
  }
  return null;
}

/**
 * Validates a Gmail address.
 * Rules:
 *   • Must not be empty.
 *   • Must be a valid email format.
 *   • Must end with @gmail.com (case-insensitive).
 *
 * @param {string} value
 * @returns {string|null} Error message or null if valid
 */
export function validateGmail(value) {
  const required = validateRequired(value, 'Gmail address');
  if (required) return required;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value.trim())) {
    return 'Please enter a valid email address.';
  }

  if (!value.trim().toLowerCase().endsWith('@gmail.com')) {
    return 'Please enter a Gmail address (must end with @gmail.com).';
  }

  return null;
}

/**
 * Validates the certificate form.
 * @param {{ fullName: string, rollNo: string, email: string }} formData
 * @returns {Object} errors keyed by field name
 */
export function validateCertificateForm(formData) {
  const errors = {};

  const fullNameError = validateRequired(formData.fullName, 'Full name');
  if (fullNameError) errors.fullName = fullNameError;

  const rollNoError = validateRequired(formData.rollNo, 'Roll number');
  if (rollNoError) errors.rollNo = rollNoError;

  const emailError = validateGmail(formData.email);
  if (emailError) errors.email = emailError;

  return errors;
}
