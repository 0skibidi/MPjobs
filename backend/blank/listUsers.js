"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("./models/User");
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = require("./config/database");
async function listUsers() {
    var _a;
    try {
        console.log('Connecting to the database...');
        await (0, database_1.connectDB)();
        console.log('Connected to MongoDB via server connection method');
        console.log('Connected to host:', mongoose_1.default.connection.host);
        console.log('Connected to database:', (_a = mongoose_1.default.connection.db) === null || _a === void 0 ? void 0 : _a.databaseName);
        if (mongoose_1.default.connection.db) {
            console.log('\nCollections in the database:');
            const collections = await mongoose_1.default.connection.db.listCollections().toArray();
            collections.forEach(collection => {
                console.log(`- ${collection.name}`);
            });
        }
        console.log('\nAdmin Users:');
        const adminUsers = await User_1.User.find({ role: 'admin' });
        console.log(`Found ${adminUsers.length} admin users`);
        adminUsers.forEach(user => {
            console.log(`- ${user.name} (${user.email}), Role: ${user.role}`);
        });
        const userCount = await User_1.User.countDocuments({ role: 'admin' });
        const employerCount = await User_1.User.countDocuments({ role: 'employer' });
        const jobseekerCount = await User_1.User.countDocuments({ role: 'jobseeker' });
        console.log('\nUser counts:');
        console.log(`- Users (admins): ${userCount}`);
        console.log(`- Employers: ${employerCount}`);
        console.log(`- Jobseekers: ${jobseekerCount}`);
        console.log('\nDone!');
        process.exit(0);
    }
    catch (error) {
        console.error('Error listing users:', error);
        process.exit(1);
    }
}
listUsers();
//# sourceMappingURL=listUsers.js.map