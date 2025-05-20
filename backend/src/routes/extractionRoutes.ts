import express from "express";
import isAuth from "../middleware/isAuth";
import * as extractionController from "../controllers/extractionController";

const extractionRoutes = express.Router();

// Middleware for validation
extractionRoutes.use(express.json());

// Routes
extractionRoutes.get("/extractions", isAuth, extractionController.list);
extractionRoutes.get("/extractions/:id", isAuth, extractionController.getDetails); // Corrigido de 'getDetalis' para 'getDetails'
extractionRoutes.post("/newextractions", isAuth, extractionController.createExtraction);
extractionRoutes.post("/createContactList", isAuth, extractionController.createContactList);
extractionRoutes.delete("/extractions/:id", isAuth, extractionController.deleteExtraction);

export default extractionRoutes;
