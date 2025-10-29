// This file ensures all models are properly registered with Mongoose
import { Job } from './Job';
import { Company } from './Company';
import { User } from './User';
import { Application } from './Application';

// Export models
export {
  Job,
  Company,
  User,
  Application
};

// This function initializes all models
export const initModels = () => {
  console.log('Initializing models...');
  
  // Just accessing these variables will ensure they're registered
  const models = {
    Job,
    Company,
    User,
    Application
  };
  
  console.log('Models initialized successfully!');
  return models;
}; 