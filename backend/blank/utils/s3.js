"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromS3 = exports.uploadToS3 = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const uuid_1 = require("uuid");
aws_sdk_1.default.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
const s3 = new aws_sdk_1.default.S3();
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';
const uploadToS3 = async (file) => {
    const key = `resumes/${(0, uuid_1.v4)()}-${file.originalname}`;
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'private'
    };
    const result = await s3.upload(params).promise();
    return result.Location;
};
exports.uploadToS3 = uploadToS3;
const deleteFromS3 = async (fileUrl) => {
    const key = fileUrl.split('/').pop();
    if (!key)
        throw new Error('Invalid file URL');
    const params = {
        Bucket: BUCKET_NAME,
        Key: `resumes/${key}`
    };
    await s3.deleteObject(params).promise();
};
exports.deleteFromS3 = deleteFromS3;
//# sourceMappingURL=s3.js.map