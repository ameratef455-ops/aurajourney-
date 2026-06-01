import { Request, Response, NextFunction } from "express";

/**
 * A simple middleware that logs each incoming request.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
};

/**
 * Placeholder for an authentication middleware.
 */
export const authGuard = (req: Request, res: Response, next: NextFunction) => {
  // In a real app, you would check for a JWT or session here
  // For now, it just passes through
  next();
};
