"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEmployerCompanyProfile = exports.getEmployerCompanyProfile = void 0;
const User_1 = require("../models/User");
const Company_1 = require("../models/Company");
const errorHandler_1 = require("../middleware/errorHandler");
const models_1 = require("../types/models");
const mongoose_1 = __importDefault(require("mongoose"));
const getEmployerCompanyProfile = async (req, res, next) => {
    try {
        console.log('🔍 getEmployerCompanyProfile called');
        if (!req.user || !req.user.userId) {
            console.log('❌ Error: Not authorized - missing user ID in token');
            return next(new errorHandler_1.AppError('Not authorized', 401));
        }
        console.log('👤 User ID from token:', req.user.userId);
        let user = await User_1.User.findById(req.user.userId);
        if (!user) {
            console.log('User not found in User model, trying employers collection...');
            const employer = await mongoose_1.default.connection.collection('employers').findOne({
                _id: new mongoose_1.default.Types.ObjectId(req.user.userId)
            });
            if (employer) {
                console.log('👤 Found user in employers collection:', employer._id);
                user = {
                    _id: employer._id,
                    name: employer.name,
                    email: employer.email,
                    role: 'employer',
                    company: employer.company,
                };
            }
            else {
                console.log('❌ Error: User not found in database with ID:', req.user.userId);
                return next(new errorHandler_1.AppError('User not found', 404));
            }
        }
        console.log('👤 User found:', { id: user._id, email: user.email, role: user.role });
        if (user.role !== models_1.UserRole.EMPLOYER) {
            console.log('❌ Error: User is not an employer', { role: user.role });
            return next(new errorHandler_1.AppError('Only employers have company profiles', 403));
        }
        if (!user.company) {
            console.log('📝 No company found for employer, creating default company profile');
            const companyData = {
                name: user.name + "'s Company",
                description: "Company description not provided yet.",
                location: {
                    street: "",
                    city: "Not specified",
                    state: "Not specified",
                    country: "USA"
                },
                industry: "Not specified",
                website: "https://example.com",
                verified: false
            };
            try {
                const newCompany = await Company_1.Company.create(companyData);
                console.log('✅ Created default company:', newCompany._id);
                user.company = newCompany._id;
                if (user._id) {
                    if (await User_1.User.findById(user._id)) {
                        await User_1.User.findByIdAndUpdate(user._id, { company: newCompany._id });
                    }
                    else {
                        await mongoose_1.default.connection.collection('employers').updateOne({ _id: new mongoose_1.default.Types.ObjectId(user._id.toString()) }, { $set: { company: newCompany._id } });
                    }
                }
                console.log('✅ Associated company with user');
                return res.status(200).json({
                    status: 'success',
                    data: {
                        company: newCompany,
                        isNewlyCreated: true
                    }
                });
            }
            catch (createError) {
                console.log('❌ Error creating default company:', createError.message);
                return next(new errorHandler_1.AppError('Failed to create default company profile', 500));
            }
        }
        console.log('🏢 Fetching company with ID:', user.company);
        const company = await Company_1.Company.findById(user.company);
        if (!company) {
            console.log('❌ Error: Company not found with ID:', user.company);
            console.log('📝 Creating replacement company for user');
            const replacementCompany = await Company_1.Company.create({
                name: user.name + "'s Company",
                description: "Company description not provided yet.",
                location: {
                    street: "",
                    city: "Not specified",
                    state: "Not specified",
                    country: "USA"
                },
                industry: "Not specified",
                website: "https://example.com",
                verified: false
            });
            if (user._id) {
                if (await User_1.User.findById(user._id)) {
                    await User_1.User.findByIdAndUpdate(user._id, { company: replacementCompany._id });
                }
                else {
                    await mongoose_1.default.connection.collection('employers').updateOne({ _id: new mongoose_1.default.Types.ObjectId(user._id.toString()) }, { $set: { company: replacementCompany._id } });
                }
            }
            console.log('✅ Created replacement company:', replacementCompany._id);
            return res.status(200).json({
                status: 'success',
                data: {
                    company: replacementCompany,
                    wasRepaired: true
                }
            });
        }
        console.log('✅ Company found successfully:', company.name);
        res.status(200).json({
            status: 'success',
            data: {
                company
            }
        });
    }
    catch (error) {
        console.error('❌ Unexpected error in getEmployerCompanyProfile:', error);
        next(error);
    }
};
exports.getEmployerCompanyProfile = getEmployerCompanyProfile;
const updateEmployerCompanyProfile = async (req, res, next) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    console.log('🔧 updateEmployerCompanyProfile called');
    console.log('Request body:', req.body);
    try {
        if (!req.user || !req.user.userId) {
            console.log('❌ Error: Not authorized - missing user ID in token');
            return next(new errorHandler_1.AppError('Not authorized', 401));
        }
        console.log('👤 User ID from token:', req.user.userId);
        let user = await User_1.User.findById(req.user.userId);
        if (!user) {
            console.log('User not found in User model, trying employers collection...');
            const employer = await mongoose_1.default.connection.collection('employers').findOne({
                _id: new mongoose_1.default.Types.ObjectId(req.user.userId)
            });
            if (employer) {
                console.log('👤 Found user in employers collection:', employer._id);
                user = {
                    _id: employer._id,
                    name: employer.name,
                    email: employer.email,
                    role: 'employer',
                    company: employer.company,
                };
            }
            else {
                console.log('❌ Error: User not found in database');
                return next(new errorHandler_1.AppError('User not found', 404));
            }
        }
        console.log('👤 User found:', { id: user._id, email: user.email, role: user.role });
        if (user.role !== models_1.UserRole.EMPLOYER) {
            console.log('❌ Error: User is not an employer', { role: user.role });
            return next(new errorHandler_1.AppError('Only employers have company profiles', 403));
        }
        const allowedFields = {};
        if (req.body.name !== undefined) {
            allowedFields['name'] = req.body.name;
        }
        if (req.body.location) {
            if (req.body.location.street !== undefined) {
                allowedFields['location.street'] = req.body.location.street;
            }
            if (req.body.location.city !== undefined) {
                if (!req.body.location.city) {
                    console.log('❌ Error: City is required');
                    return next(new errorHandler_1.AppError('City is required', 400));
                }
                allowedFields['location.city'] = req.body.location.city;
            }
            if (req.body.location.state !== undefined) {
                if (!req.body.location.state) {
                    console.log('❌ Error: State is required');
                    return next(new errorHandler_1.AppError('State is required', 400));
                }
                allowedFields['location.state'] = req.body.location.state;
            }
            if (req.body.location.country !== undefined) {
                allowedFields['location.country'] = req.body.location.country;
            }
        }
        console.log('🔄 Updating company with fields:', allowedFields);
        if (!user.company) {
            console.log('📝 No company found for employer, creating new company profile from update data');
            const completeCompanyData = {
                name: req.body.name || user.name + "'s Company",
                description: "Company description not provided yet.",
                location: {
                    street: ((_a = req.body.location) === null || _a === void 0 ? void 0 : _a.street) || "",
                    city: ((_b = req.body.location) === null || _b === void 0 ? void 0 : _b.city) || "Not specified",
                    state: ((_c = req.body.location) === null || _c === void 0 ? void 0 : _c.state) || "Not specified",
                    country: ((_d = req.body.location) === null || _d === void 0 ? void 0 : _d.country) || "USA"
                },
                industry: "Not specified",
                website: "https://example.com",
                verified: false
            };
            try {
                const newCompany = await Company_1.Company.create(completeCompanyData);
                console.log('✅ Created new company during update:', newCompany._id);
                user.company = newCompany._id;
                if (user._id) {
                    if (await User_1.User.findById(user._id)) {
                        await User_1.User.findByIdAndUpdate(user._id, { company: newCompany._id });
                    }
                    else {
                        await mongoose_1.default.connection.collection('employers').updateOne({ _id: new mongoose_1.default.Types.ObjectId(user._id.toString()) }, { $set: { company: newCompany._id } });
                    }
                }
                console.log('✅ Associated company with user');
                return res.status(200).json({
                    status: 'success',
                    data: {
                        company: newCompany,
                        isNewlyCreated: true
                    }
                });
            }
            catch (createError) {
                console.log('❌ Error creating company during update:', createError.message);
                if (createError.name === 'ValidationError') {
                    console.log('Validation errors:', createError.errors);
                    return next(new errorHandler_1.AppError(`Validation error: ${Object.values(createError.errors).map(e => e.message).join(', ')}`, 400));
                }
                return next(new errorHandler_1.AppError('Failed to create company profile', 500));
            }
        }
        try {
            const company = await Company_1.Company.findByIdAndUpdate(user.company, allowedFields, { new: true, runValidators: true });
            if (!company) {
                console.log('❌ Error: Company not found after update attempt');
                console.log('📝 Creating replacement company for user during update');
                const replacementData = {
                    name: req.body.name || user.name + "'s Company",
                    description: "Company description not provided yet.",
                    location: {
                        street: ((_e = req.body.location) === null || _e === void 0 ? void 0 : _e.street) || "",
                        city: ((_f = req.body.location) === null || _f === void 0 ? void 0 : _f.city) || "Not specified",
                        state: ((_g = req.body.location) === null || _g === void 0 ? void 0 : _g.state) || "Not specified",
                        country: ((_h = req.body.location) === null || _h === void 0 ? void 0 : _h.country) || "USA"
                    },
                    industry: "Not specified",
                    website: "https://example.com",
                    verified: false
                };
                const replacementCompany = await Company_1.Company.create(replacementData);
                if (user._id) {
                    if (await User_1.User.findById(user._id)) {
                        await User_1.User.findByIdAndUpdate(user._id, { company: replacementCompany._id });
                    }
                    else {
                        await mongoose_1.default.connection.collection('employers').updateOne({ _id: new mongoose_1.default.Types.ObjectId(user._id.toString()) }, { $set: { company: replacementCompany._id } });
                    }
                }
                console.log('✅ Created replacement company during update:', replacementCompany._id);
                return res.status(200).json({
                    status: 'success',
                    data: {
                        company: replacementCompany,
                        wasRepaired: true
                    }
                });
            }
            console.log('✅ Company updated successfully:', { id: company._id, name: company.name });
            res.status(200).json({
                status: 'success',
                data: {
                    company
                }
            });
        }
        catch (updateError) {
            console.log('❌ Error during company update:', updateError.message);
            if (updateError.name === 'ValidationError') {
                console.log('Validation errors:', updateError.errors);
                return next(new errorHandler_1.AppError(`Validation error: ${Object.values(updateError.errors).map(e => e.message).join(', ')}`, 400));
            }
            throw updateError;
        }
    }
    catch (error) {
        console.log('❌ Unhandled error:', error.message);
        next(error);
    }
};
exports.updateEmployerCompanyProfile = updateEmployerCompanyProfile;
//# sourceMappingURL=user.controller.js.map