import { Request, Response, NextFunction } from "express";

export default function mongoSanitizer(req: Request, res: Response, next: NextFunction) {
    const sanitize = (obj: any) => {
        for (let key in obj) {
            if (typeof obj[key] === "object") sanitize(obj[key]);
            if (key.startsWith("$") || key.includes(".")) delete obj[key];
        }
    };
    sanitize(req.body);
    sanitize(req.query);
    sanitize(req.params);
    next();
};