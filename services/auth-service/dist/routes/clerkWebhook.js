"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const svix_1 = require("svix");
const user_service_1 = require("../services/user.service");
const clerkWebhook = express_1.default.Router();
clerkWebhook.post("/clerk", express_1.default.raw({ type: "application/json" }), async (req, res) => {
    try {
        const payload = req.body;
        const headers = req.headers;
        console.log("🔔 Webhook received!");
        console.log("Headers:", JSON.stringify(headers, null, 2));
        console.log("Body type:", typeof payload, "Is Buffer:", Buffer.isBuffer(payload));
        const wh = new svix_1.Webhook(process.env.CLERK_WEBHOOK_SECRET);
        const event = wh.verify(payload, headers);
        console.log("✅ Verified event:", event.type);
        if (event.type === "user.created" || event.type === "user.updated") {
            const data = event.data;
            console.log(`👤 Processing user ${event.type}:`, data.id);
            try {
                const user = await (0, user_service_1.upsertUser)(data);
                if (user) {
                    console.log("🎉 User saved in DB:", user._id);
                }
            }
            catch (dbErr) {
                console.error("❌ Database operation failed:", dbErr);
            }
        }
        else if (event.type === "user.deleted") {
            const data = event.data;
            try {
                await (0, user_service_1.deleteUser)(data.id);
                console.log("🗑️ User deleted:", data.id);
            }
            catch (err) {
                console.error("Delete failed:", err);
            }
        }
        else {
            console.log("ℹ️ Unhandled event type:", event.type);
        }
        res.status(200).json({ received: true });
    }
    catch (err) {
        console.error("Webhook error:", err);
        res.status(400).json({ error: "Webhook failed" });
    }
});
exports.default = clerkWebhook;
