import { HttpError } from '../lib/http-error.js';

// Handle all application errors.
export function errorHandler(err, req, res, next) {
  // Pass the error to Express if headers were already sent.
  if (res.headersSent) {
    return next(err);
  }

  // Handle expected HTTP errors.
  if (err instanceof HttpError) {
    const error = {
      message: err.message,
    };

    // Include details only for validation errors.
    if (err.status === 400 && err.details !== undefined) {
      error.details = err.details;
    }

    return res.status(err.status).json({
      error,
    });
  }

  // Log unexpected errors to the terminal.
  console.error(err);

  // Never expose internal errors or stack traces to clients.
  return res.status(500).json({
    error: {
      message: 'Internal server error',
    },
  });
}