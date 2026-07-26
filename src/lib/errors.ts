export function getErrorMessage(error: unknown, fallback = "操作失败，请重试") {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
