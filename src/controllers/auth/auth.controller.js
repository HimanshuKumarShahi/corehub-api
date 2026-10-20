import User from "../../models/auth/User.models.js";
import { ApiError } from "../../utils/api-error.js";
import { ApiResponse } from "../../utils/api-response.js";
import crypto from "crypto";
import { Op } from "sequelize";
import {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
} from "../../utils/mail.js";

const ACTIVE_DB = process.env.ACTIVE_DB || "mongo";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    let user =
      ACTIVE_DB === "mongo"
        ? await User.findById(userId)
        : await User.findByPk(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    ACTIVE_DB === "mongo"
      ? await user.save({ validateBeforeSave: false })
      : await user.save({ validate: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens.");
  }
};

// Register User

export const registerUser = async (req, res) => {
  try {
    const { email, username, password, fullName } = req.body;

    let existedUser =
      ACTIVE_DB === "mongo"
        ? await User.findOne({ $or: [{ username }, { email }] })
        : await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });

    if (existedUser) {
      throw new ApiError(409, "User with email or username already exists.");
    }

    const user = await User.create({ email, password, username, fullName });

    const { unHashedToken, hashedToken, tokenExpiry } =
      user.generateTemproryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    ACTIVE_DB === "mongo"
      ? await user.save({ validateBeforeSave: false })
      : await user.save();

    const verificationUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`;

    await sendEmail({
      email: user.email,
      subject: "Please verify your email",
      mailgenContent: emailVerificationMailgenContent(
        user.username,
        verificationUrl
      ),
    });

    let createdUser =
      ACTIVE_DB === "mongo"
        ? await User.findById(user._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
          )
        : await User.findByPk(user.id, {
            attributes: {
              exclude: [
                "password",
                "refreshToken",
                "emailVerificationToken",
                "emailVerificationExpiry",
              ],
            },
          });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user: createdUser },
          "User registered. Please check email to verify."
        )
      );
  } catch (error) {
    throw new ApiError("Register user Error",error)
  }
};

// Login User

export const loginUser = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    if (!email && !username)
      throw new ApiError(400, "Username or email is required.");

    let user =
      ACTIVE_DB === "mongo"
        ? await User.findOne({ $or: [{ username }, { email }] })
        : await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });

    if (!user) throw new ApiError(404, "User does not exist.");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials.");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user.id || user._id
    );

    let loggedInUser =
      ACTIVE_DB === "mongo"
        ? await User.findById(user._id).select("-password -refreshToken")
        : await User.findByPk(user.id, {
            attributes: { exclude: ["password", "refreshToken"] },
          });

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
  } catch (error) {
    next(error);
  }
};

// Logout User

export const logoutUser = async (req, res, next) => {
  try {
    let user =
      ACTIVE_DB === "mongo"
        ? await User.findById(req.user._id)
        : await User.findByPk(req.user.id);

    user.refreshToken = null;
    ACTIVE_DB === "mongo"
      ? await user.save({ validateBeforeSave: false })
      : await user.save();

    return res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json(new ApiResponse(200, {}, "User logged out successfully."));
  } catch (error) {
    next(error);
  }
};

// verify email

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    let user =
      ACTIVE_DB === "mongo"
        ? await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpiry: { $gt: Date.now() },
          })
        : await User.findOne({
            where: {
              emailVerificationToken: hashedToken,
              emailVerificationExpiry: { [Op.gt]: Date.now() },
            },
          });

    if (!user) throw new ApiError(400, "Token is invalid or has expired.");

    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    user.isEmailVerified = true;
    ACTIVE_DB === "mongo"
      ? await user.save({ validateBeforeSave: false })
      : await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Email verified successfully."));
  } catch (error) {
    next(error);
  }
};

// Forgot-Password

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    let user =
      ACTIVE_DB === "mongo"
        ? await User.findOne({ email })
        : await User.findOne({ where: { email } });

    if (!user) throw new ApiError(404, "User with this email does not exist.");

    const { unHashedToken, hashedToken, tokenExpiry } =
      user.generateTemproryToken();
    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;
    ACTIVE_DB === "mongo"
      ? await user.save({ validateBeforeSave: false })
      : await user.save();

    const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${unHashedToken}`;

    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      mailgenContent: forgotPasswordMailgenContent(user.username, resetUrl),
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password reset email sent."));
  } catch (error) {
    next(error);
  }
};
