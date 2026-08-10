import { z } from "zod";

export const getStorageSchema = z.object({
    params: z.object({}), 
    body: z.object({}), 
    query: z.object({})
})

export type getStorageDto = z.infer<typeof getStorageSchema>