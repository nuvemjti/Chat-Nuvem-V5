import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import Captacao from "../models/Captacao";
import CaptacaoItens from "../models/CaptacaoItens";


export const list = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.params;
  try {
    const captacoes = await Captacao.findAll({
      where: { companyId },
      include: [{ model: CaptacaoItens }],
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json({ data: captacoes });
  } catch (error) {
    console.error("Error in list captacoes:", error);
    throw new AppError("Error fetching captacoes");
  }
};

export const create = async (req: Request, res: Response): Promise<Response> => {
  const schema = Yup.object().shape({
    state: Yup.string().required(),
    city: Yup.string().required(),
    segment: Yup.string().required(),
    companyId: Yup.number().required()
  });

  try {
    await schema.validate(req.body);

    const captacao = await Captacao.create({
      ...req.body,
      status: 1,
      userId: req.user.id
    });

    return res.status(200).json(captacao);
  } catch (error) {
    console.error("Error in create captacao:", error);
    throw new AppError(error.message);
  }
};

export const createContactList = async (req: Request, res: Response): Promise<Response> => {
  const { captacaoId } = req.body;

  try {
    const captacao = await Captacao.findByPk(captacaoId, {
      include: [{ model: CaptacaoItens }]
    });

    if (!captacao) {
      throw new AppError("Captação não encontrada");
    }

    // Implementar lógica de criação da lista de contatos

    return res.status(200).json({ message: "Lista criada com sucesso" });
  } catch (error) {
    console.error("Error in createContactList:", error);
    throw new AppError(error.message);
  }
}; 