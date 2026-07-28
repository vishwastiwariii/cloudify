import type { CookieOptions } from "express";
import config from "../../config/env";

export const AUTH_COOKIE_NAME = "accessToken"

export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: config.node_env === "production",
  sameSite: "lax",
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  path: "/",
};