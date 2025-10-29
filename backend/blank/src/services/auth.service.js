"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
class AuthService {
    static async register(data) {
        const existingUser = await User_1.User.findOne({ email: data.email });
        if (existingUser) {
            throw new Error('Email already registered');
        }
        const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
        const user = await User_1.User.create({
            ...data,
            password: hashedPassword
        });
        const token = this.generateToken(user);
        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                verified: user.verified
            },
            token
        };
    }
    static async login(data) {
        const user = await User_1.User.findOne({ email: data.email });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isPasswordValid = await bcrypt_1.default.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        const token = this.generateToken(user);
        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                verified: user.verified
            },
            token
        };
    }
    static generateToken(user) {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        return jsonwebtoken_1.default.sign({
            id: user._id,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map