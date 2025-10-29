"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../models/User");
dotenv_1.default.config();
async function listUsers() {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(mongoURI);
        console.log('Connected successfully!');
        const users = await User_1.User.find({}).select('-password');
        console.log('\nUsers in database:');
        console.log('==================');
        if (users.length === 0) {
            console.log('No users found in the database.');
        }
        else {
            users.forEach((user, index) => {
                console.log(`\nUser ${index + 1}:`);
                console.log('- ID:', user._id);
                console.log('- Name:', user.name);
                console.log('- Email:', user.email);
                console.log('- Role:', user.role);
                console.log('- Email Verified:', user.emailVerified);
                console.log('- Created At:', user.createdAt);
            });
            console.log(`\nTotal users: ${users.length}`);
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        process.exit();
    }
}
listUsers();
//# sourceMappingURL=listUsers.js.map