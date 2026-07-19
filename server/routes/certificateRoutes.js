import { Router } from 'express';
import { body } from 'express-validator';
import { generateCertificate } from '../controllers/certificateController.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();
router.post('/generate', [
  body('name').isString().withMessage('Please provide your full name.').trim().notEmpty().withMessage('Full name is required.').isLength({ max: 120 }).withMessage('Full name must be 120 characters or fewer.'),
], validateRequest, generateCertificate);
export default router;
