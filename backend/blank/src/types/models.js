"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobStatus = exports.JobType = void 0;
var JobType;
(function (JobType) {
    JobType["FULL_TIME"] = "FULL_TIME";
    JobType["PART_TIME"] = "PART_TIME";
    JobType["CONTRACT"] = "CONTRACT";
    JobType["INTERNSHIP"] = "INTERNSHIP";
    JobType["TEMPORARY"] = "TEMPORARY";
})(JobType || (exports.JobType = JobType = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["PENDING"] = "PENDING";
    JobStatus["ACTIVE"] = "ACTIVE";
    JobStatus["CLOSED"] = "CLOSED";
    JobStatus["DRAFT"] = "DRAFT";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
//# sourceMappingURL=models.js.map