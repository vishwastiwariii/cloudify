import type { CookieOptions, Response } from "express";
import config from "../../config/env";

export const AUTH_COOKIE_NAME = "accessToken"

const isProduction = config.node_env === "production";

export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  // API and frontend are on different domains (EC2 vs Vercel), so the cookie
  // must be SameSite=None to be sent on cross-site requests. That requires
  // Secure, which is only true in production (i.e. only over HTTPS).
  sameSite: isProduction ? "none" : "lax",
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  path: "/",
};

export function setAuthCookie (
  res: Response, 
  token: string
) {
  res.cookie(
    AUTH_COOKIE_NAME, 
    token, 
    AUTH_COOKIE_OPTIONS
  )
}

export function clearCookie (
  res: Response
) {
  res.clearCookie(
    AUTH_COOKIE_NAME, 
    AUTH_COOKIE_OPTIONS
  )
}