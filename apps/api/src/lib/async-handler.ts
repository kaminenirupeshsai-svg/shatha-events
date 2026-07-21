import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Express 4 does not forward rejected promises from async handlers to
 * next(); every controller in modules/* is async, so instead of repeating
 * try/catch everywhere (or adding express-async-errors as a dependency) we
 * wrap each handler once here. Any thrown/rejected error - AppError or not -
 * flows into middleware/error-handler.ts.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
