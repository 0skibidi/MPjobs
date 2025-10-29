"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initModels = exports.Application = exports.User = exports.Company = exports.Job = void 0;
const Job_1 = require("./Job");
Object.defineProperty(exports, "Job", { enumerable: true, get: function () { return Job_1.Job; } });
const Company_1 = require("./Company");
Object.defineProperty(exports, "Company", { enumerable: true, get: function () { return Company_1.Company; } });
const User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.User; } });
const Application_1 = require("./Application");
Object.defineProperty(exports, "Application", { enumerable: true, get: function () { return Application_1.Application; } });
const initModels = () => {
    console.log('Initializing models...');
    const models = {
        Job: Job_1.Job,
        Company: Company_1.Company,
        User: User_1.User,
        Application: Application_1.Application
    };
    console.log('Models initialized successfully!');
    return models;
};
exports.initModels = initModels;
//# sourceMappingURL=index.js.map