import mongoose, { Schema } from "mongoose";
import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sequelize } from "../../config/db.js";
import { AvailableUserRoles, UserRolesEnum } from "../../utils/constants.js";

const ACTIVE_DB = process.env.ACTIVE_DB || "mongo";

let User;

if (ACTIVE_DB === "mongo") {
  const userSchema = new Schema(
    {
      avatar: {
        type: {
          url: String,
          localPath: String,
        },
        default: {
          url: "https://placehold.co/200x200",
          localPath: "",
        },
      },
      username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      fullName: {
        type: String,
        trim: true,
      },
      password: {
        type: String,
        required: [true, "Password is required."],
      },
      role: {
        type: String,
        enum: AvailableUserRoles,
        default: UserRolesEnum.USER,
      },
      isEmailVerified: {
        type: Boolean,
        default: false,
      },
      refreshToken: {
        type: String,
      },
      forgotPasswordToken: {
        type: String,
      },
      forgotPasswordExpiry: {
        type: Date,
      },
      emailVerificationToken: {
        type: String,
      },
      emailVerificationExpiry: {
        type: Date,
      },
    },
    { timestamps: true }
  );

  // Mongoose Hooks

  userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });

  // Mongoose Methods
  userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
      {
        _id: this._id,
        email: this.email,
        username: this.username,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
  };

  userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
      {
        _id: this._id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );
  };

  userSchema.methods.generateTemproryToken = function () {
    const unHashedToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(unHashedToken)
      .digest("hex");
    const tokenExpiry = Date.now() + 20 * 60 * 1000;
    return { unHashedToken, hashedToken, tokenExpiry };
  };

  User = mongoose.model("User", userSchema);
} else {
  User = sequelize.define("User", {
    avatar: {
      type: DataTypes.JSONB,
      defaultValue: {
        url: "https://placehold.co/200x200",
        localPath: "",
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    fullName: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...AvailableUserRoles),
      defaultValue: UserRolesEnum.USER,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    refreshToken: {
      type: DataTypes.STRING,
    },
    forgotPasswordToken: {
      type: DataTypes.STRING,
    },
    forgotPasswordExpiry: {
      type: DataTypes.DATE,
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
    },
    emailVerificationExpiry: {
      type: DataTypes.DATE,
    },
  });

  // Sequelize Hooks
  const hashPassword = async (user) => {
    if (user.changed("password")) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  };
  User.beforeCreate(hashPassword);
  User.beforeUpdate(hashPassword);

  // Sequelize Methods (Attached to prototype)
  User.prototype.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  User.prototype.generateAccessToken = function () {
    return jwt.sign(
      {
        _id: this.id,
        email: this.email,
        username: this.username,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
  };

  User.prototype.generateRefreshToken = function () {
    return jwt.sign({ _id: this.id }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });
  };

  User.prototype.generateTemproryToken = function () {
    const unHashedToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(unHashedToken)
      .digest("hex");
    const tokenExpiry = Date.now() + 20 * 60 * 1000;
    return { unHashedToken, hashedToken, tokenExpiry };
  };
}

export default User;
