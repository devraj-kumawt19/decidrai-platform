"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireInternalAuth = void 0;
const requireInternalAuth = (req, res, next) => {
    const serviceSecret = req.headers["x-service-secret"];
    if (!process.env.SERVICE_SECRET) {
        console.error("Missing SERVICE_SECRET environment variable");
        res.status(500).json({ error: "Internal Server Error: Misconfiguration" });
        return;
    }
    if (!serviceSecret || serviceSecret !== process.env.SERVICE_SECRET) {
        res.status(401).json({ error: "Unauthorized: Invalid Service Secret" });
        return;
    }
    next();
};
exports.requireInternalAuth = requireInternalAuth;
