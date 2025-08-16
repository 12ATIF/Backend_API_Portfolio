import express from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";

import router from "./routes/index.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use(router);

export default app;
