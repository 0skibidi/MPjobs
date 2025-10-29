"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const models_1 = require("../types/models");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect);
router.get('/employer/company', (0, auth_middleware_1.authorize)(models_1.UserRole.EMPLOYER), user_controller_1.getEmployerCompanyProfile);
router.patch('/employer/company', (0, auth_middleware_1.authorize)(models_1.UserRole.EMPLOYER), user_controller_1.updateEmployerCompanyProfile);
exports.default = router;
//# sourceMappingURL=user.routes.js.map