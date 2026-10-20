import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  forgotPassword,
} from "../../controllers/auth/auth.controller.js";

import {
  validate,
  userRegisterValidator,
  userLoginValidator,
  forgotPasswordValidator,
} from "../../middlewares/auth/validator.middleware.js";

import { verifyJWT } from "../../middlewares/auth/auth.middleware.js";

const router = Router();

router.post("/register", userRegisterValidator(), validate, registerUser);
router.post("/login", userLoginValidator(), validate, loginUser);
router.post(
  "/forgot-password",
  forgotPasswordValidator(),
  validate,
  forgotPassword
);
router.get("/verify-email/:token", verifyEmail);

router.post("/logout", verifyJWT, logoutUser);
export default router;
