import express from "express";

import * as MetaController from "../controllers/MetaController";

const webhookMetaRoutes = express.Router();

webhookMetaRoutes.get("/:id",  MetaController.index);
webhookMetaRoutes.post("/:id", MetaController.webHook);

export default webhookMetaRoutes;
