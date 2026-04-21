import express from "express";
import CreateWorkSpaceAndCreateAdminAccount from "../controllers/UserController";

const route = express.Router();

route.post("/create-workspace", CreateWorkSpaceAndCreateAdminAccount);

export default route;
