import { Router } from "express";
import {
  getCurrentUser,
  getUserProfileByUsername,
  updateAccountDetails,
  updateUserAvatar,
  changeCurrentPassword,
} from "../../controllers/users/user.controller.js";

import {
  validate,
  updateProfileValidator,
  changePasswordValidator,
} from "../../validators/index.js";

import { verifyJWT } from "../../middlewares/auth/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = Router();

// PUBLIC ROUTE
router.get("/profile/:username", getUserProfileByUsername);

// SECURED ROUTES
router.get("/me", verifyJWT, getCurrentUser);

router.patch(
  "/profile",
  verifyJWT,
  updateProfileValidator(),
  validate,
  updateAccountDetails
);

router.patch("/avatar", verifyJWT, upload.single("avatar"), updateUserAvatar);

router.post(
  "/change-password",
  verifyJWT,
  changePasswordValidator(),
  validate,
  changeCurrentPassword
);

export default router;
