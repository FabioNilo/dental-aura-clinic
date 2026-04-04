type ErrorLike = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
};

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const value = error as ErrorLike;
    const parts = [value.message, value.details, value.hint].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }

  return fallback;
}
