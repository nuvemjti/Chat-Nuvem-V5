import express from "express";
import * as CaptacaoController from "../controllers/CaptacaoController";
import isAuth from "../middleware/isAuth";

const captacaoRoutes = express.Router();

captacaoRoutes.get("/extractions/:companyId", isAuth, CaptacaoController.list);
captacaoRoutes.post("/newextractions", isAuth, CaptacaoController.create);
captacaoRoutes.post("/createContactList", isAuth, CaptacaoController.createContactList);

export default captacaoRoutes; 