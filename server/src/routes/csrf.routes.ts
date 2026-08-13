import { Router, Request, Response } from 'express';
import { generateCsrfToken, doubleCsrfProtection } from '../config/csrf';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';

const router = Router();

router.get('/csrf-token', (req: Request, res: Response) => {
  const token = generateCsrfToken(req, res);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('CSRF token generated', { csrfToken: token }));
});

export { doubleCsrfProtection };
export default router;
