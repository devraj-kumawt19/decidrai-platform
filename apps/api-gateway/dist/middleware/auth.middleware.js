"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const auth_1 = require("@decidrai/auth");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            res.status(401).json({ error: "Unauthorized - Missing or Invalid Token" });
            return;
        }
        const token = authHeader.split(" ")[1];
        const sessionData = await (0, auth_1.validateClerkSession)(token);
        if (!sessionData) {
            res.status(401).json({ error: "Unauthorized - Invalid Token" });
            return;
        }
        // Extract userId (sub) using safe optional chaining just in case
        const userId = sessionData.sub;
        if (!userId) {
            res.status(401).json({ error: "Unauthorized - Invalid Token Payload" });
            return;
        }
        // Extract role with fallback
        const metadata = sessionData.public_metadata || {};
        const role = metadata.role || sessionData.role || 'user';
        req.user = { userId, role };
        next();
    }
    catch (error) {
        console.error("[AuthMiddleware] Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.authMiddleware = authMiddleware;
