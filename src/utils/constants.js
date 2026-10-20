// CORE AUTHENTICATION ROLES
export const UserRolesEnum = {
  SUPER_ADMIN: "super_admin",
  DOMAIN_ADMIN: "domain_admin",
  USER: "user",
};

export const AvailableUserRoles = Object.values(UserRolesEnum);

// ACCOUNT LIFE-CYCLE STATUSES

export const AccountStatusEnum = {
  PENDING_VERIFICATION: "pending_verification",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  BANNED: "banned",
};

export const AvailableAccountStatuses = Object.values(AccountStatusEnum);

// LOGIN PROVIDERS (For future scaling)

export const LoginProviderEnum = {
  EMAIL_PASSWORD: "email_password",
  GOOGLE: "google",
  GITHUB: "github",
};

export const AvailableLoginProviders = Object.values(LoginProviderEnum);
