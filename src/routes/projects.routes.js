import { Router } from 'express';
import { listProjects, getProject, createProject, attachAsset, setCover } from '../controllers/projects.controller.js';


const r = Router();


r.get('/', listProjects);
r.get('/:id', getProject);
r.post('/', createProject);
r.post('/:id/assets', attachAsset);
r.post('/:id/cover/:assetId', setCover);


export default r;