import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  forgotPassword,
  resetPassword
} from "../../controllers/auth/auth.controller.js";

import {
  validate,
  userRegisterValidator,
  userLoginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../../validators/index.js";

import { verifyJWT } from "../../middlewares/auth/auth.middleware.js";

const router = Router();

router.post("/register", userRegisterValidator(), validate, registerUser);
router.post("/login", userLoginValidator(), validate, loginUser);
router.post("/forgot-password", forgotPasswordValidator(), validate, forgotPassword);
router.get("/verify-email/:token", verifyEmail);

router.post(
  "/reset-password/:token",
  resetPasswordValidator(),
  validate,
  resetPassword
);

router.post("/logout", verifyJWT, logoutUser);

export default router;
