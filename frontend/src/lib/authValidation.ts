export type AuthFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

// Letters from any language, spaces, apostrophes, periods and hyphens only.
const NAME_PATTERN = /^[\p{L}][\p{L}\p{M} .'-]*$/u;

// Standard email shape: local part + domain with at least one dot and a 2+ letter TLD.
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export type ValidationResult = true | string;

export type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "One number",
    test: (value) => /[0-9]/.test(value),
  },
  {
    id: "special",
    label: "One special character",
    test: (value) => /[^A-Za-z0-9\s]/.test(value),
  },
  {
    id: "spaces",
    label: "No spaces",
    test: (value) => !/\s/.test(value),
  },
];

export const getNameError = (value: string): ValidationResult => {
  const name = value.trim();

  if (!name) return "Please enter your full name.";
  if (name.length < NAME_MIN_LENGTH) {
    return `Name must be at least ${NAME_MIN_LENGTH} characters.`;
  }
  if (name.length > NAME_MAX_LENGTH) {
    return `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  }
  if (!NAME_PATTERN.test(name)) {
    return "Use letters, spaces, apostrophes, periods, or hyphens only.";
  }

  return true;
};

export const getEmailError = (value: string): ValidationResult => {
  const email = value.trim();

  if (!email) return "Please enter your email address.";
  if (email.length > EMAIL_MAX_LENGTH) {
    return `Email must be ${EMAIL_MAX_LENGTH} characters or fewer.`;
  }
  if (/\s/.test(email)) return "Email cannot contain spaces.";
  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address, e.g. name@example.com.";
  }

  const [localPart, domain] = email.split("@");

  if (localPart.length > 64) {
    return "The part before @ must be 64 characters or fewer.";
  }
  if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
    return "Email cannot start or end with a dot, or contain two dots in a row.";
  }
  if (domain.includes("..")) return "Email domain is not valid.";
  if (domain.split(".").some((part) => !part || part.startsWith("-") || part.endsWith("-"))) {
    return "Email domain is not valid.";
  }

  return true;
};

export const getPasswordError = (value: string): ValidationResult => {
  if (!value) return "Please create a password.";
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`;
  }
  if (/\s/.test(value)) return "Password cannot contain spaces.";
  if (!/[A-Z]/.test(value)) return "Add at least one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Add at least one lowercase letter.";
  if (!/[0-9]/.test(value)) return "Add at least one number.";
  if (!/[^A-Za-z0-9\s]/.test(value)) {
    return "Add at least one special character (e.g. !@#$%).";
  }

  return true;
};

// Login only checks that a password was entered so existing accounts are not locked out.
export const getLoginPasswordError = (value: string): ValidationResult =>
  value ? true : "Please enter your password.";

export const getConfirmPasswordError = (
  value: string,
  password: string,
): ValidationResult => {
  if (!value) return "Please re-enter your password.";
  if (value !== password) return "Passwords do not match.";
  return true;
};
