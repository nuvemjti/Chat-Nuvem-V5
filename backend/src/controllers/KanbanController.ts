import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import Setting from "../models/Setting";

export const saveState = async (req: Request, res: Response): Promise<Response> => {
  const { userId, state } = req.body;

  const schema = Yup.object().shape({
    userId: Yup.number().required(),
    state: Yup.object().required()
  });

  try {
    await schema.validate({ userId, state });

    // Salvar o estado como uma configuração do usuário
    const [setting] = await Setting.findOrCreate({
      where: {
        key: `kanban-state-${userId}`,
        userId
      },
      defaults: {
        key: `kanban-state-${userId}`,
        value: JSON.stringify(state),
        userId
      }
    });

    if (setting) {
      // Atualizar se já existir
      await setting.update({
        value: JSON.stringify(state)
      });
    }

    return res.status(200).json({ message: "Estado salvo com sucesso" });
  } catch (err) {
    throw new AppError(
      "Erro ao salvar estado do Kanban: " + err.message
    );
  }
};

export const getState = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;

  try {
    const setting = await Setting.findOne({
      where: {
        key: `kanban-state-${userId}`,
        userId
      }
    });

    if (!setting) {
      return res.status(404).json({ message: "Nenhum estado salvo encontrado" });
    }

    return res.status(200).json({
      state: JSON.parse(setting.value)
    });

  } catch (err) {
    throw new AppError(
      "Erro ao recuperar estado do Kanban: " + err.message
    );
  }
}; 