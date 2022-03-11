import { Router } from 'express';

const router = Router();

/**
 * Log a user out.
 * @param {Object} req Request object.
 * @param {Object} res Response object.
 * @returns Redirection to login page.
 */
const logUserOut = (req, res) => {
  res.clearCookie('user');
  res.redirect('/');
};

router
  .route('/')
  .delete((req, res) => logUserOut(req, res));

export default router;
