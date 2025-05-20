import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as KanbanController from "../controllers/KanbanController";

const kanbanRoutes = Router();

kanbanRoutes.post("/save-state", isAuth, KanbanController.saveState);
kanbanRoutes.get("/state/:userId", isAuth, KanbanController.getState);

export default kanbanRoutes; 