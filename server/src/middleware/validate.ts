import { Request, Response, NextFunction } from 'express'
import { z, ZodError, ZodSchema } from 'zod'

type Source = 'body' | 'params' | 'query'

export function validate<T>(schema: ZodSchema<T>, source: Source = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      res.status(400).json({
        error: 'validation_failed',
        details: formatIssues(result.error),
      })
      return
    }
    ;(req as Request & Record<Source, T>)[source] = result.data
    next()
  }
}

function formatIssues(err: ZodError) {
  return err.issues.map((i) => ({
    path: i.path.join('.') || '(root)',
    message: i.message,
  }))
}

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'invalid id')
