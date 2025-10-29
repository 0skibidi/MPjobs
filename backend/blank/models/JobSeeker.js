"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jobSeekerSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    skills: [{
            type: String,
            trim: true
        }],
    education: [{
            school: {
                type: String,
                required: true
            },
            degree: {
                type: String,
                required: true
            },
            graduationYear: {
                type: Number,
                required: true
            }
        }],
    experience: [{
            title: {
                type: String,
                required: true
            },
            company: {
                type: String,
                required: true
            },
            startDate: {
                type: Date,
                required: true
            },
            endDate: Date,
            current: {
                type: Boolean,
                default: false
            },
            description: String
        }],
    resume: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});
jobSeekerSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
jobSeekerSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcryptjs_1.default.compare(candidatePassword, this.password);
    }
    catch (error) {
        return false;
    }
};
exports.default = mongoose_1.default.model('JobSeeker', jobSeekerSchema);
//# sourceMappingURL=JobSeeker.js.map