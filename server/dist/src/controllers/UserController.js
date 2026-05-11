"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CreateWorkSpaceAndCreateAdminAccount;
function CreateWorkSpaceAndCreateAdminAccount(req, res, next) {
    try {
        const { workspaceName, fullName, email, password } = req.body;
        if (!workspaceName && !fullName && !email && !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            });
        }
    }
    catch (error) {
        next(error);
    }
}
