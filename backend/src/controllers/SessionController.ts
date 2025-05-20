import { Request, Response } from "express";
import AppError from "../errors/AppError";
import { getIO } from "../libs/socket";

import AuthUserService from "../services/UserServices/AuthUserService";
import { SendRefreshToken } from "../helpers/SendRefreshToken";
import { RefreshTokenService } from "../services/AuthServices/RefreshTokenService";
import FindUserFromToken from "../services/AuthServices/FindUserFromToken";
import User from "../models/User";

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  const { token, serializedUser, refreshToken } = await AuthUserService({
    email,
    password
  });

  SendRefreshToken(res, refreshToken);

  const io = getIO();

  io.of(serializedUser.companyId.toString())
    .emit(`company-${serializedUser.companyId}-auth`, {
      action: "update",
      user: {
        id: serializedUser.id,
        email: serializedUser.email,
        companyId: serializedUser.companyId,
        token: serializedUser.token
      }
    });

  return res.status(200).json({
    token,
    user: serializedUser
  });
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const token: string = req.cookies.jrt;

  if (!token) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const { user, newToken, refreshToken } = await RefreshTokenService(
    res,
    token
  );

  SendRefreshToken(res, refreshToken);

  return res.json({ token: newToken, user });
};

export const me = async (req: Request, res: Response): Promise<Response> => {
  const token: string = req.cookies.jrt;
  const user = await FindUserFromToken(token);
  const { id, profile, super: superAdmin } = user;

  if (!token) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  return res.json({ id, profile, super: superAdmin });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.user;
  if (id) {
    const user = await User.findByPk(id);
    await user.update({ online: false });
  }
  res.clearCookie("jrt");

  return res.send();
};

// Adiciona a nova função para atualizar o status do usuário (online/offline)
export const updateStatus = async (req: Request, res: Response): Promise<Response> => {
  const { userId, online } = req.body;

  // Verifica se userId e online foram passados corretamente
  if (!userId || online === undefined) {
    return res.status(400).send("userId and online status are required.");
  }

  try {
    // Atualiza o status do usuário no banco de dados
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    await user.update({ online });

    // Emitir um evento de atualização de status via WebSocket (se necessário)
    const io = getIO();
    io.of(user.companyId.toString()).emit(`company-${user.companyId}-status`, {
      action: "update",
      user: {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        online: user.online,
      }
    });

    return res.sendStatus(200); // Status OK
  } catch (error) {
    console.error("Erro ao atualizar o status do usuário:", error);
    return res.status(500).send("Error updating user status.");
  }
};
