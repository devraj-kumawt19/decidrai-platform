"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = exports.disconnectMongo = exports.connectMongo = void 0;
var mongo_1 = require("./mongo");
Object.defineProperty(exports, "connectMongo", { enumerable: true, get: function () { return mongo_1.connectMongo; } });
Object.defineProperty(exports, "disconnectMongo", { enumerable: true, get: function () { return mongo_1.disconnectMongo; } });
var redis_1 = require("./redis");
Object.defineProperty(exports, "getRedisClient", { enumerable: true, get: function () { return redis_1.getRedisClient; } });
