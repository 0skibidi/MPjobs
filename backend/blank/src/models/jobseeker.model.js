"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jobseeker = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const jobseekerSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    resume: {
        type: String
    },
    skills: [{
            type: String,
            trim: true
        }],
    appliedJobs: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Job'
        }],
    savedJobs: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Job'
        }],
    emailVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
jobseekerSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
exports.Jobseeker = mongoose_1.default.model('Jobseeker', jobseekerSchema);
//# sourceMappingURL=jobseeker.model.js.map