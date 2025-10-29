"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const models_1 = require("../types/models");
const JobSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Job title is required'],
        trim: true,
        maxlength: [100, 'Job title cannot exceed 100 characters']
    },
    company: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company is required']
    },
    description: {
        type: String,
        required: [true, 'Job description is required'],
        trim: true,
        maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    requirements: [{
            type: String,
            trim: true
        }],
    location: {
        city: {
            type: String,
            required: [true, 'City is required']
        },
        state: {
            type: String,
            required: [true, 'State is required']
        },
        country: {
            type: String,
            required: [true, 'Country is required']
        },
        remote: {
            type: Boolean,
            default: false
        }
    },
    salaryRange: {
        min: {
            type: Number,
            required: [true, 'Minimum salary is required']
        },
        max: {
            type: Number,
            required: [true, 'Maximum salary is required']
        },
        currency: {
            type: String,
            default: 'USD'
        }
    },
    jobType: {
        type: String,
        enum: Object.values(models_1.JobType),
        required: [true, 'Job type is required']
    },
    status: {
        type: String,
        enum: Object.values(models_1.JobStatus),
        default: models_1.JobStatus.PENDING
    },
    applicationDeadline: {
        type: Date,
        required: [true, 'Application deadline is required'],
        validate: {
            validator: function (value) {
                return value > new Date();
            },
            message: 'Application deadline must be in the future'
        }
    },
    skills: [{
            type: String,
            trim: true
        }],
    viewsCount: {
        type: Number,
        default: 0
    },
    applications: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
JobSchema.index({ title: 'text', description: 'text', skills: 'text' });
JobSchema.index({ status: 1 });
JobSchema.index({ jobType: 1 });
JobSchema.index({ company: 1 });
JobSchema.index({ 'location.country': 1, 'location.state': 1, 'location.city': 1 });
JobSchema.index({ applicationDeadline: 1 });
JobSchema.index({ 'salaryRange.min': 1, 'salaryRange.max': 1 });
JobSchema.index({ createdAt: -1 });
JobSchema.virtual('applicationCount').get(function () {
    return this.applications.length;
});
JobSchema.pre('save', function (next) {
    if (this.isModified('salaryRange')) {
        if (this.salaryRange.min > this.salaryRange.max) {
            next(new Error('Minimum salary cannot be greater than maximum salary'));
        }
    }
    next();
});
JobSchema.pre('save', function (next) {
    if (this.isModified('skills')) {
        this.skills = this.skills.map(skill => skill.trim());
    }
    if (this.isModified('requirements')) {
        this.requirements = this.requirements.map(req => req.trim());
    }
    next();
});
exports.Job = mongoose_1.default.model('Job', JobSchema);
//# sourceMappingURL=Job.js.map