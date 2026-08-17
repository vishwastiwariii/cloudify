import type { CookieOptions, Response } from "express";
import config from "../../config/env";

export const AUTH_COOKIE_NAME = "accessToken"

export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: config.node_env === "production",
  sameSite: "lax",
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