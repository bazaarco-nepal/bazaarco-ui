export const passwordRequirementMessage =
  "Password must be at least 8 characters and include a number and symbol.";

export function isStrongPassword(value: string) {
  return value.length >= 8 && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}
