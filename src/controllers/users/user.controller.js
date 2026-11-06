import User from "../../models/auth/User.models.js";
import { ApiError } from "../../utils/api-error.js";
import { ApiResponse } from "../../utils/api-response.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { uploadFile, removeLocalFile } from "../../utils/storage.js";


// logged in user Details
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry"
  );

  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user },
        "Logged-in user details fetched successfully."
      )
    );
});

// Get Public Profile by Username
export const getUserProfileByUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({
    username: username?.toLowerCase().trim(),
  }).select("username fullName avatar role isEmailVerified createdAt");

  if (!user) {
    throw new ApiError(404, "User profile does not exist.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { profile: user },
        "Public profile fetched successfully."
      )
    );
});
// update profile details
export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, username } = req.body;

  if (!fullName && !username) {
    throw new ApiError(400, "Please provide fullName or username to update.");
  }

  const currentUser = await User.findById(req.user?._id);

  if (!currentUser) {
    throw new ApiError(404, "User account not found.");
  }

  if (username) {
    const existingUser = await User.findOne({
      username: username.toLowerCase().trim(),
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      throw new ApiError(409, "Username is already taken by another user.");
    }
    currentUser.username = username.toLowerCase().trim();
  }

  if (fullName) {
    currentUser.fullName = fullName.trim();
  }

  await currentUser.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(req.user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry"
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser },
        "Profile details updated successfully."
      )
    );
});

// update user avatar
export const updateUserAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Avatar image file is required.");
  }

  const currentUser = await User.findById(req.user?._id);
  if (!currentUser) {
    removeLocalFile(req.file.path);
    throw new ApiError(404, "User account not found.");
  }

  const uploadedAvatar = await uploadFile(req, req.file);

  if (currentUser.avatar?.localPath) {
    removeLocalFile(currentUser.avatar.localPath);
  }

  currentUser.avatar = {
    url: uploadedAvatar.url,
    localPath: uploadedAvatar.localPath,
  };

  await currentUser.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(req.user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry"
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser },
        "Avatar updated successfully."
      )
    );
});
// change password
export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid old password.");
  }

  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully."));
});
