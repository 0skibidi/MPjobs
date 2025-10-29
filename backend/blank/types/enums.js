"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationStatus = exports.JobStatus = exports.JobType = void 0;
var JobType;
(function (JobType) {
    JobType["FULL_TIME"] = "FULL_TIME";
    JobType["PART_TIME"] = "PART_TIME";
    JobType["CONTRACT"] = "CONTRACT";
    JobType["INTERNSHIP"] = "INTERNSHIP";
})(JobType || (exports.JobType = JobType = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["PENDING"] = "PENDING";
    JobStatus["APPROVED"] = "APPROVED";
    JobStatus["REJECTED"] = "REJECTED";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["PENDING"] = "PENDING";
    ApplicationStatus["ACCEPTED"] = "ACCEPTED";
    ApplicationStatus["REJECTED"] = "REJECTED";
    ApplicationStatus["INTERVIEW"] = "INTERVIEW";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
//# sourceMappingURL=enums.js.map