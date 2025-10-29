import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from '../middleware/errorHandler';

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadDir = file.fieldname === 'resume' ? 'uploads/resumes' : 'uploads/logos';
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === 'resume') {
    // Allow only PDF files for resumes
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new AppError('Only PDF files are allowed for resumes', 400));
    }
  } else if (file.fieldname === 'logo') {
    // Allow images for company logos
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed for logos', 400));
    }
  } else {
    cb(new AppError('Invalid file field', 400));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware for specific upload types
export const uploadResume = upload.single('resume');
export const uploadLogo = upload.single('logo'); 