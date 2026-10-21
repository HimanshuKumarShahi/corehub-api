import User from "../../models/auth/User.models.js";
import { ApiError } from "../../utils/api-error.js";
import { ApiResponse } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import crypto from "crypto";
import {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
} from "../../utils/mail.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens.");
  }
};

// Register User

export const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, fullName } = req.body;

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists.");
  }

  const user = await User.create({ email, password, username, fullName });

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemproryToken();
  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`;

  await sendEmail({
    email: user.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      user.username,
      verificationUrl
    ),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: createdUser },
        "User registered. Please check email to verify."
      )
    );
});

// Login User

export const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new ApiError(400, "Username or email is required.");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    throw new ApiError(404, "User does not exist.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully."
      )
    );
});

// Logout User

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { returnDocument: "after" }
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully."));
});

// verify email

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or has expired.");
  }

  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Email verified successfully."));
});

// Forgot-Password

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User with this email does not exist.");
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemproryToken();
  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${unHashedToken}`;

  await sendEmail({
    email: user.email,
    subject: "Password Reset Request",
    mailgenContent: forgotPasswordMailgenContent(user.username, resetUrl),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset email sent."));
});

// Reset password

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Reset token is invalid or has expired.");
  }
  user.password = password;

  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully."));
});
