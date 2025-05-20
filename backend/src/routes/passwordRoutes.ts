import express from "express";
import * as PasswordResetController from "../controllers/PasswordResetController";

const passwordRoutes = express.Router();

// Rota para envio de códigos de verificação via WhatsApp
passwordRoutes.post("/api/enviar-codigo", PasswordResetController.sendCodeVerifycation); // Corrigido o nome para corresponder à função do controlador

// Rota para verificar o código de verificação
passwordRoutes.post("/api/verificar-code", PasswordResetController.getVerificationData); // Mantido para verificar o código

// Rota para obter todos os usuários
passwordRoutes.get("/api/obter-usuarios", PasswordResetController.getAllUsers);

// Rota para atualizar a senha
passwordRoutes.put("/api/atualizar-senha", PasswordResetController.updatePassword);

export default passwordRoutes;
