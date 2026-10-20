import { body } from "express-validator";

export const userRegisterValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("username is required.")
      .isLowercase()
      .withMessage("username must be lower case")
      .isLength({ min: 3 })
      .withMessage("username must be at least 3 characters long"),
    body("password").trim().notEmpty().withMessage("Password is required."),
    body("fullname").optional().trim().notEmpty(),
  ];
};
