import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../types/models';
import mongoose from 'mongoose';

// Get employer company profile
export const getEmployerCompanyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔍 getEmployerCompanyProfile called');
    
    if (!req.user || !req.user.userId) {
      console.log('❌ Error: Not authorized - missing user ID in token');
      return next(new AppError('Not authorized', 401));
    }
    
    console.log('👤 User ID from token:', req.user.userId);

    // Try to find user in User model first
    let user = await User.findById(req.user.userId);
    
    // If not found, try to find in the employers collection
    if (!user) {
      console.log('User not found in User model, trying employers collection...');
      
      // Try to get user from employers collection
      const employer = await mongoose.connection.collection('employers').findOne({ 
        _id: new mongoose.Types.ObjectId(req.user.userId) 
      });
      
      if (employer) {
        console.log('👤 Found user in employers collection:', employer._id);
        
        // Create a compatible user object
        user = {
          _id: employer._id,
          name: employer.name,
          email: employer.email,
          role: 'employer',
          company: employer.company,
        };
      } else {
        console.log('❌ Error: User not found in database with ID:', req.user.userId);
        return next(new AppError('User not found', 404));
      }
    }
    
    console.log('👤 User found:', { id: user._id, email: user.email, role: user.role });

    if (user.role !== UserRole.EMPLOYER) {
      console.log('❌ Error: User is not an employer', { role: user.role });
      return next(new AppError('Only employers have company profiles', 403));
    }

    // Check if user has a company associated
    if (!user.company) {
      console.log('📝 No company found for employer, creating default company profile');
      
      // Create a default company for this employer
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
        // Create the company
        const newCompany = await Company.create(companyData);
        console.log('✅ Created default company:', newCompany._id);
        
        // Associate the company with the user
        user.company = newCompany._id;
        
        // Save the company ID to the appropriate collection
        if (user._id) {
          // If the user is in the User model
          if (await User.findById(user._id)) {
            await User.findByIdAndUpdate(user._id, { company: newCompany._id });
          } 
          // If the user is in the employers collection
          else {
            await mongoose.connection.collection('employers').updateOne(
              { _id: new mongoose.Types.ObjectId(user._id.toString()) },
              { $set: { company: newCompany._id } }
            );
          }
        }
        
        console.log('✅ Associated company with user');
        
        // Return the newly created company
        return res.status(200).json({
          status: 'success',
          data: {
            company: newCompany,
            isNewlyCreated: true
          }
        });
      } catch (createError: any) {
        console.log('❌ Error creating default company:', createError.message);
        return next(new AppError('Failed to create default company profile', 500));
      }
    }

    // If we reach here, the user has a company - fetch it
    console.log('🏢 Fetching company with ID:', user.company);
    const company = await Company.findById(user.company);
    
    if (!company) {
      console.log('❌ Error: Company not found with ID:', user.company);
      
      // This is a data integrity issue - user has a company ID but the company doesn't exist
      // Let's fix it by creating a new company
      console.log('📝 Creating replacement company for user');
      
      const replacementCompany = await Company.create({
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
      
      // Update the user's company reference in the appropriate collection
      if (user._id) {
        // If the user is in the User model
        if (await User.findById(user._id)) {
          await User.findByIdAndUpdate(user._id, { company: replacementCompany._id });
        } 
        // If the user is in the employers collection
        else {
          await mongoose.connection.collection('employers').updateOne(
            { _id: new mongoose.Types.ObjectId(user._id.toString()) },
            { $set: { company: replacementCompany._id } }
          );
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

    // Normal successful case
    console.log('✅ Company found successfully:', company.name);
    
    res.status(200).json({
      status: 'success',
      data: {
        company
      }
    });
  } catch (error) {
    console.error('❌ Unexpected error in getEmployerCompanyProfile:', error);
    next(error);
  }
};

// Update employer company profile
export const updateEmployerCompanyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('🔧 updateEmployerCompanyProfile called');
  console.log('Request body:', req.body);
  
  try {
    if (!req.user || !req.user.userId) {
      console.log('❌ Error: Not authorized - missing user ID in token');
      return next(new AppError('Not authorized', 401));
    }
    
    console.log('👤 User ID from token:', req.user.userId);

    // Try to find user in User model first
    let user = await User.findById(req.user.userId);
    
    // If not found, try to find in the employers collection
    if (!user) {
      console.log('User not found in User model, trying employers collection...');
      
      // Try to get user from employers collection
      const employer = await mongoose.connection.collection('employers').findOne({ 
        _id: new mongoose.Types.ObjectId(req.user.userId) 
      });
      
      if (employer) {
        console.log('👤 Found user in employers collection:', employer._id);
        
        // Create a compatible user object
        user = {
          _id: employer._id,
          name: employer.name,
          email: employer.email,
          role: 'employer',
          company: employer.company,
        };
      } else {
        console.log('❌ Error: User not found in database');
        return next(new AppError('User not found', 404));
      }
    }
    
    console.log('👤 User found:', { id: user._id, email: user.email, role: user.role });

    if (user.role !== UserRole.EMPLOYER) {
      console.log('❌ Error: User is not an employer', { role: user.role });
      return next(new AppError('Only employers have company profiles', 403));
    }

    // Process company data from request
    // Only allow updating specific fields
    const allowedFields: any = {};
    
    // Check and assign each field individually with validation
    if (req.body.name !== undefined) {
      allowedFields['name'] = req.body.name;
    }
    
    // Handle location fields
    if (req.body.location) {
      if (req.body.location.street !== undefined) {
        allowedFields['location.street'] = req.body.location.street;
      }
      
      if (req.body.location.city !== undefined) {
        if (!req.body.location.city) {
          console.log('❌ Error: City is required');
          return next(new AppError('City is required', 400));
        }
        allowedFields['location.city'] = req.body.location.city;
      }
      
      if (req.body.location.state !== undefined) {
        if (!req.body.location.state) {
          console.log('❌ Error: State is required');
          return next(new AppError('State is required', 400));
        }
        allowedFields['location.state'] = req.body.location.state;
      }
      
      if (req.body.location.country !== undefined) {
        allowedFields['location.country'] = req.body.location.country;
      }
    }
    
    console.log('🔄 Updating company with fields:', allowedFields);

    // If user doesn't have a company, create one with the provided data
    if (!user.company) {
      console.log('📝 No company found for employer, creating new company profile from update data');
      
      // Prepare complete company data from update fields
      const completeCompanyData = {
        name: req.body.name || user.name + "'s Company",
        description: "Company description not provided yet.",
        location: {
          street: req.body.location?.street || "",
          city: req.body.location?.city || "Not specified",
          state: req.body.location?.state || "Not specified",
          country: req.body.location?.country || "USA"
        },
        industry: "Not specified",
        website: "https://example.com",
        verified: false
      };
      
      try {
        // Create the company
        const newCompany = await Company.create(completeCompanyData);
        console.log('✅ Created new company during update:', newCompany._id);
        
        // Associate the company with the user
        user.company = newCompany._id;
        
        // Update the user's company reference in the appropriate collection
        if (user._id) {
          // If the user is in the User model
          if (await User.findById(user._id)) {
            await User.findByIdAndUpdate(user._id, { company: newCompany._id });
          } 
          // If the user is in the employers collection
          else {
            await mongoose.connection.collection('employers').updateOne(
              { _id: new mongoose.Types.ObjectId(user._id.toString()) },
              { $set: { company: newCompany._id } }
            );
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
      } catch (createError: any) {
        console.log('❌ Error creating company during update:', createError.message);
        if (createError.name === 'ValidationError') {
          console.log('Validation errors:', createError.errors);
          return next(new AppError(`Validation error: ${Object.values(createError.errors).map(e => (e as any).message).join(', ')}`, 400));
        }
        return next(new AppError('Failed to create company profile', 500));
      }
    }

    // Update existing company profile
    try {
      const company = await Company.findByIdAndUpdate(
        user.company,
        allowedFields,
        { new: true, runValidators: true }
      );

      if (!company) {
        console.log('❌ Error: Company not found after update attempt');
        
        // This is a data integrity issue - user has a company ID but the company doesn't exist
        // Let's fix it by creating a new company
        console.log('📝 Creating replacement company for user during update');
        
        // Prepare complete company data from update fields
        const replacementData = {
          name: req.body.name || user.name + "'s Company",
          description: "Company description not provided yet.",
          location: {
            street: req.body.location?.street || "",
            city: req.body.location?.city || "Not specified",
            state: req.body.location?.state || "Not specified",
            country: req.body.location?.country || "USA"
          },
          industry: "Not specified",
          website: "https://example.com",
          verified: false
        };
        
        const replacementCompany = await Company.create(replacementData);
        
        // Update the user's company reference in the appropriate collection
        if (user._id) {
          // If the user is in the User model
          if (await User.findById(user._id)) {
            await User.findByIdAndUpdate(user._id, { company: replacementCompany._id });
          } 
          // If the user is in the employers collection
          else {
            await mongoose.connection.collection('employers').updateOne(
              { _id: new mongoose.Types.ObjectId(user._id.toString()) },
              { $set: { company: replacementCompany._id } }
            );
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
    } catch (updateError: any) {
      console.log('❌ Error during company update:', updateError.message);
      if (updateError.name === 'ValidationError') {
        console.log('Validation errors:', updateError.errors);
        return next(new AppError(`Validation error: ${Object.values(updateError.errors).map(e => (e as any).message).join(', ')}`, 400));
      }
      throw updateError;
    }
  } catch (error: any) {
    console.log('❌ Unhandled error:', error.message);
    next(error);
  }
}; 