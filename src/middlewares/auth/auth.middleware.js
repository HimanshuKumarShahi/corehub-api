import jwt from "jsonwebtoken";
import User from "../../models/auth/User.models.js"; 
import { ApiError } from "../../utils/api-error.js"; 

const ACTIVE_DB = process.env.ACTIVE_DB || "mongo";

export const verifyJWT = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request: No token provided");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    let user;
    if (ACTIVE_DB === "mongo") {
      user = await User.findById(decodedToken._id).select("-password -refreshToken");
    } else {
      user = await User.findByPk(decodedToken._id, {
        attributes: { exclude: ["password", "refreshToken"] },
      });
    }

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(401, error?.message || "Invalid access token"));
  }
};