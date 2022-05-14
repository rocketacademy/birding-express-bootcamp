import express from 'express';
import {
  homeController,
  aboutController,
  loginController,
  postLoginController,
  signUpController,
  postSignUpController,
  profileController,
  postLogoutController,
} from '../controllers/indexController.js';

const router = express.Router();

router.get('/', homeController);
router.get('/about', aboutController);
router.get('/login', loginController);
router.get('/signUp', signUpController);
router.get('/profile', profileController);
router.post('/login', postLoginController);
router.post('/signUp', postSignUpController);
router.post('/logout', postLogoutController);

export default router;
