// Error handling utilities

export interface ErrorWithMessage {
    message: string;
}

export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as Record<string, unknown>).message === 'string'
    );
}

export function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
    if (isErrorWithMessage(maybeError)) return maybeError;

    try {
        return new Error(JSON.stringify(maybeError));
    } catch {
        // Fallback if object cannot be serialized
        return new Error(String(maybeError));
    }
}

export function getErrorMessage(error: unknown): string {
    return toErrorWithMessage(error).message;
}
