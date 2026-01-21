"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateClerkSession = void 0;
const backend_1 = require("@clerk/backend");
const validateClerkSession = async (token) => {
    if (!process.env.CLERK_SECRET_KEY) {
        console.error("Missing CLERK_SECRET_KEY environment variable");
        return null;
    }
    try {
        const result = await (0, backend_1.verifyToken)(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
            clockSkewInMs: 300 * 1000, // Allow 5 minutes skew
        });
        return result;
    }
    catch (error) {
        console.error("Clerk validation error:", error);
        return null;
    }
};
exports.validateClerkSession = validateClerkSession;
