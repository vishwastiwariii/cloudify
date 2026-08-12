import type { Request, Response } from "express"
import { AuthError } from "../auth/auth.service"
import { DashboardService } from "./dashboard.service"

const dashboardService = new DashboardService()

export async function getDashboard(req: Request, res: Response) {
    try {
        if(!req.user){
            throw new AuthError("Authentication Required", 401)
        }

        const result = await dashboardService.getDashboard(req.user.id)

        return res.status(200).json({
            success: true,
            data: result,
            message: "Dashboard Fetched Successfully"
        })
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues });
        }

        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({ success: false, message: error.message, errors: [] });
        }

        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error', errors: [] });
    }
}
