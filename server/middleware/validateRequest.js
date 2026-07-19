import { validationResult, body } from 'express-validator';

/**
 * Validation rules for the POST /api/generate-certificate endpoint.
 */
export const generateCertificateRules = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ max: 120 }).withMessage('Full name must be at most 120 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isMobilePhone('any', { strictMode: false }).withMessage('Please provide a valid phone number.'),

  body('college')
    .trim()
    .notEmpty().withMessage('College name is required.')
    .isLength({ max: 200 }).withMessage('College name must be at most 200 characters.'),

  body('semester')
    .trim()
    .notEmpty().withMessage('Semester is required.')
    .isIn(['1st', '2nd', '3rd', '4th', '5th', '6th']).withMessage('Invalid semester value.'),

  body('division')
    .trim()
    .notEmpty().withMessage('Division is required.')
    .isIn(['A', 'B', 'C', 'D']).withMessage('Invalid division value.'),

  body('eventName')
    .trim()
    .notEmpty().withMessage('Event name is required.')
    .isLength({ max: 200 }).withMessage('Event name must be at most 200 characters.'),

  body('certificateType')
    .trim()
    .notEmpty().withMessage('Certificate type is required.')
    .isIn(['Participation', 'Completion', 'Winner', 'Volunteer']).withMessage('Invalid certificate type.'),

  body('date')
    .trim()
    .notEmpty().withMessage('Date is required.')
    .isISO8601().withMessage('Date must be a valid ISO 8601 date.'),
];

/**
 * Middleware that checks express-validator results and returns 422 if invalid.
 */
export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}
