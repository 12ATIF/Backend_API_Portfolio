import { seed } from "../controllers/dev.controller.js";

const r = Router();

r.post("/seed", seed);

export default r;
