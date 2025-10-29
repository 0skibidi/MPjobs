"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function testConnection() {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        console.log('Attempting to connect to MongoDB...');
        await mongoose_1.default.connect(mongoURI);
        console.log('Successfully connected to MongoDB!');
        console.log('Connection Details:');
        console.log(`Database Host: ${mongoose_1.default.connection.host}`);
        console.log(`Database Name: ${mongoose_1.default.connection.name}`);
        console.log(`Database State: ${mongoose_1.default.connection.readyState}`);
    }
    catch (error) {
        console.error('Failed to connect to MongoDB:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        process.exit();
    }
}
testConnection();
//# sourceMappingURL=testConnection.js.map