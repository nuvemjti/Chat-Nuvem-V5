import { sign } from "jsonwebtoken";
import authConfig from "../config/auth";
import User from "../models/User";

export const createAccessToken = (user: User): string => {
  const { secret, expiresIn } = authConfig;

  return sign(
    {
      username: user.name,
      profile: user.profile,
      id: user.id,
      companyId: user.companyId
    },
    secret,
    {
      expiresIn,
      algorithm: "HS256", // Especificando o algoritmo de assinatura
    }
  );
};

export const createRefreshToken = (user: User): string => {
  const { refreshSecret, refreshExpiresIn } = authConfig;

  return sign(
    { id: user.id, tokenVersion: user.tokenVersion, companyId: user.companyId },
    refreshSecret,
    {
      expiresIn: refreshExpiresIn,
      algorithm: "HS256", // Especificando o algoritmo de assinatura
    }
  );
};
