import { Router } from 'express';
import { body } from 'express-validator';
import { generateCertificate } from '../controllers/certificateController.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();
router.post('/generate', [
  body('roll_no').isString().withMessage('Please provide your roll number.').trim().notEmpty().withMessage('Roll number is required.').isLength({ max: 20 }).withMessage('Roll number must be 20 characters or fewer.'),
], validateRequest, generateCertificate);
export default router;
