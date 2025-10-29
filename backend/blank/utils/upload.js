"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadLogo = exports.uploadResume = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const errorHandler_1 = require("../middleware/errorHandler");
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = file.fieldname === 'resume' ? 'uploads/resumes' : 'uploads/logos';
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'resume') {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new errorHandler_1.AppError('Only PDF files are allowed for resumes', 400));
        }
    }
    else if (file.fieldname === 'logo') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new errorHandler_1.AppError('Only image files are allowed for logos', 400));
        }
    }
    else {
        cb(new errorHandler_1.AppError('Invalid file field', 400));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});
exports.uploadResume = exports.upload.single('resume');
exports.uploadLogo = exports.upload.single('logo');
//# sourceMappingURL=upload.js.map