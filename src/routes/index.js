import { Router } from "express";
import { sequelize } from "../config/db.js";
import projects from "./projects.routes.js";
import assets from "./assets.routes.js";
import dev from "./dev.routes.js";
import upload from './upload.routes.js'



const router = Router();
router.use('/upload', upload)
router.get("/health", (req, res) => res.json({ status: "ok" }));

router.use("/projects", projects);
router.use("/assets", assets);
router.use("/dev", dev);

router.get("/", (req, res) =>
  res.json({ name: "Portfolio API (Express MVC)", version: "0.1.0" })
);

export default router;
