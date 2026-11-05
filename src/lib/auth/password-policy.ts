export const PASSWORD_MIN_LENGTH = 8;

// Characters Cognito accepts as "special": ^ $ * . [ ] { } ( ) ? - " ! @ # % & / \ , > < ' : ; | _ ~ ` + =
const SYMBOL_REGEX = /[\^$*.[\]{}()?\-"!@#%&/\\,><':;|_~`+=]/;

export interface PasswordRule {
  id: string;
  label: string;
  met: boolean;
}

export function evaluatePassword(password: string): PasswordRule[] {
  return [
    { id: "length", label: `At least ${PASSWORD_MIN_LENGTH} characters`, met: password.length >= PASSWORD_MIN_LENGTH },
    { id: "upper", label: "At least 1 uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { id: "lower", label: "At least 1 lowercase letter (a-z)", met: /[a-z]/.test(password) },
    { id: "number", label: "At least 1 number (0-9)", met: /[0-9]/.test(password) },
    { id: "symbol", label: "At least 1 special symbol such as . - _ ! @ &", met: SYMBOL_REGEX.test(password) },
  ];
}

export function isPasswordValid(password: string): boolean {
  return evaluatePassword(password).every((r) => r.met);
}

export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special symbol such as . - _ ! @ &.";

