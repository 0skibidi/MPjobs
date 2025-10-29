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
exports.Company = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CompanySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        maxlength: [100, 'Company name cannot exceed 100 characters'],
        unique: true
    },
    description: {
        type: String,
        required: [true, 'Company description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    logo: {
        type: String,
        default: 'default-company-logo.png'
    },
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
    industry: {
        type: String,
        required: [true, 'Industry is required'],
        trim: true
    },
    website: {
        type: String,
        required: [true, 'Website is required'],
        match: [
            /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
            'Please provide a valid website URL'
        ]
    },
    postedJobs: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Job'
        }],
    verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
CompanySchema.index({ name: 1 });
CompanySchema.index({ industry: 1 });
CompanySchema.index({ 'location.country': 1, 'location.state': 1, 'location.city': 1 });
CompanySchema.virtual('jobs', {
    ref: 'Job',
    localField: '_id',
    foreignField: 'company'
});
CompanySchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.name = this.name.trim();
    }
    if (this.isModified('description')) {
        this.description = this.description.trim();
    }
    next();
});
exports.Company = mongoose_1.default.model('Company', CompanySchema);
//# sourceMappingURL=Company.js.map