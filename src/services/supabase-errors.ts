interface SupabaseLikeError {
  message: string;
}

const FALLBACK_MESSAGE = 'No se pudo completar la operación. Intentá de nuevo.';

function isSupabaseLikeError(error: unknown): error is SupabaseLikeError {
  if (!error || typeof error !== 'object') return false;

  return (
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  );
}

export function toServiceError(
  error: unknown,
  fallbackMessage = FALLBACK_MESSAGE,
): Error {
  if (error instanceof Error) return error;
  if (isSupabaseLikeError(error)) return new Error(error.message);
  return new Error(fallbackMessage);
}

export function throwIfSupabaseError(
  error: unknown,
  fallbackMessage?: string,
): asserts error is null | undefined {
  if (error) {
    throw toServiceError(error, fallbackMessage);
  }
}
