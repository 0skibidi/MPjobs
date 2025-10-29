"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationStatus = exports.UserRole = exports.JobStatus = exports.JobType = void 0;
var JobType;
(function (JobType) {
    JobType["FULL_TIME"] = "FULL_TIME";
    JobType["PART_TIME"] = "PART_TIME";
    JobType["VOLUNTEERING"] = "VOLUNTEERING";
    JobType["INTERNSHIP"] = "INTERNSHIP";
    JobType["TEMPORARY"] = "TEMPORARY";
})(JobType || (exports.JobType = JobType = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["PENDING"] = "PENDING";
    JobStatus["APPROVED"] = "APPROVED";
    JobStatus["REJECTED"] = "REJECTED";
    JobStatus["CLOSED"] = "CLOSED";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["EMPLOYER"] = "employer";
    UserRole["JOBSEEKER"] = "jobseeker";
})(UserRole || (exports.UserRole = UserRole = {}));
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["PENDING"] = "PENDING";
    ApplicationStatus["REVIEWING"] = "REVIEWING";
    ApplicationStatus["ACCEPTED"] = "ACCEPTED";
    ApplicationStatus["REJECTED"] = "REJECTED";
    ApplicationStatus["WITHDRAWN"] = "WITHDRAWN";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
//# sourceMappingURL=models.js.map