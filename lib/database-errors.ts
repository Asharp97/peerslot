export function isPostgresError(error: unknown, code: string): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if ("code" in error && error.code === code) {
    return true;
  }

  return "cause" in error && isPostgresError(error.cause, code);
}
