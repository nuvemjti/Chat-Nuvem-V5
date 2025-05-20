import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as TicketTagController from "../controllers/TicketTagController";

const ticketTagRoutes = Router();

// Rota para adicionar tag
ticketTagRoutes.put("/ticket-tags/:ticketId/:tagId", isAuth, TicketTagController.store);

// Rota para remover tag
ticketTagRoutes.delete("/ticket-tags/:ticketId", isAuth, TicketTagController.remove);

export default ticketTagRoutes;
