import { Router } from "express";
import { createAsset } from "../controllers/assets.controller.js";

const r = Router();

r.post("/", createAsset);

export default r;
