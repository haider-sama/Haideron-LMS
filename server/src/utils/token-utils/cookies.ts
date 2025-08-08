// src/utils/token-utils/cookies.ts
import { CookieOptions, Response } from "express";
import { fifteenMinutesFromNow, sevenDaysFromNow } from "../date";
import { NODE_ENV } from "../../constants/env";

export const REFRESH_PATH = "/api/auth/refresh-token";
const isDev = NODE_ENV === "development";

const defaults: CookieOptions = {
    sameSite: "lax", // 'none' if using HTTPS in prod, 'lax' on localhost
    httpOnly: true,
    secure: false,
    path: "/",
};

export const getAccessTokenCookieOptions = (): CookieOptions => ({
    ...defaults,
    expires: fifteenMinutesFromNow(),
});

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
    ...defaults,
    expires: sevenDaysFromNow(),
});

type Params = {
    res: Response;
    accessToken: string;
    refreshToken?: string;
};

export const setAuthCookies = ({ res, accessToken, refreshToken }: Params) =>
    res
        .cookie("auth_token", accessToken, getAccessTokenCookieOptions())
        .cookie("refresh_token", refreshToken!, getRefreshTokenCookieOptions());

export const clearAuthCookies = (res: Response) =>
    res
        .clearCookie("auth_token", { path: "/" })
        .clearCookie("refresh_token", { path: "/" });