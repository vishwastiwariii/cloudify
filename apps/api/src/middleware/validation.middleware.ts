import type { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => 
    async (req: Request, _res: Response, next: NextFunction) => {
        try {

            const validatedData = await schema.parseAsync({
                body: req.body,
                params: req.params,
                query: req.query
            })

            req.body = validatedData.body
            req.params = validatedData.params
            req.query = validatedData.query

            next()
        } catch (error) {
            if(error instanceof ZodError) {
                return next(error)
            }
            
            next(error)
        }
    }