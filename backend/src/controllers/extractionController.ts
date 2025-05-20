import { exec } from "child_process";
import { Request, Response } from "express";
import CaptacaoItens from "../models/CaptacaoItens";
import Captacao from "../models/Captacao";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import CreateServiceCab from "../services/ContactListService/CreateService";
import CreateServiceItem from "../services/ContactListItemService/CreateService";
import { getIO } from "../libs/socket"
import path from 'path';


// Definindo o tipo de dados que são recebidos para criação
type StoreData = {
  city: string;
  state: string;
  segment: string;
  leadCount: number;
};

export const createExtraction = async (req: Request, res: Response): Promise<Response> => {
  const data = req.body as StoreData;
  const { companyId } = req.user;
  const { id } = req.user;
  const userId = id

  const schema = Yup.object().shape({
    city: Yup.string().required("Cidade é obrigatória."),
    state: Yup.string().required("Estado é obrigatório."),
    segment: Yup.string().required("Segmento é obrigatório."),
    leadCount: Yup.number().required("Quantidade de leads é obrigatória.").positive("A quantidade de leads deve ser um número positivo."),
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  try {
    const { city, state, segment, leadCount } = data;

    const captacao = await Captacao.create({
      status: 1, // Status "gerando"
      state,
      city,
      segment,
      userId,
      companyId
    });


    res.status(200).json({
      message: "Captação iniciada. O processo está sendo executado.",
      captacaoId: captacao.id,
    });

    const isWindows = process.platform === 'win32';
    const pythonExecutable = isWindows ? 'python.exe' : 'python';
    const binFolder = isWindows ? 'Scripts' : 'bin';
    
    const pythonPath = path.join(process.cwd(),  'src', 'scripts', 'venv', binFolder, pythonExecutable);
    const scriptPath = path.join(process.cwd(),  'src', 'scripts', 'GMapsPlaywright.py');
    
    const pythonCommand = `"${pythonPath}" "${scriptPath}" --state "${state}" --city "${city}" --segment "${segment}" --totalResults "${leadCount}"`;

    exec(pythonCommand, async (error, stdout, stderr) => {
      if (error || stderr) {
        console.error(`Erro ao executar script Python: ${error?.message || stderr}`);
        await captacao.update({ status: 3 }); // Status "erro"
      }

      try {
        const extractedData = JSON.parse(stdout || "[]");
        const leadItems = extractedData.map((lead: any) => ({
          captacaoId: captacao.id,
          Name: lead.name || null,
          Email: lead.website || null,
          Phone: lead.phone_number || null,
          adress: lead.address || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await CaptacaoItens.bulkCreate(leadItems);
        await captacao.update({ status: 2 }); // Status "finalizado"

      } catch (parseError) {
        console.error("Erro ao processar dados extraídos:", parseError);
        await captacao.update({ status: 3 }); // Status "erro"


      }
    });

    return res;
  } catch (error) {
    console.error("Erro ao processar a extração:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};
export const list = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { companyId } = req.user;

    // Parâmetros para paginação
    const { page = 1, limit = 10 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const limitNumber = Number(limit);

    // Buscar captações com itens relacionados e filtrando pelo companyId
    const captacoes = await Captacao.findAndCountAll({
      where: { companyId },
      include: [
        {
          model: CaptacaoItens,
          as: "itens", // Certifique-se de que o alias corresponde ao definido na associação
        },
      ],
      limit: limitNumber,
      offset,
      order: [["createdAt", "DESC"]],
    });

    // Retornar a resposta com as captações e informações de paginação
    return res.status(200).json({
      data: captacoes.rows,
      total: captacoes.count,
      page: Number(page),
      totalPages: Math.ceil(captacoes.count / limitNumber),
    });
  } catch (error) {
    console.error("Erro ao listar captações:", error);
    return res.status(500).json({ error: "Erro ao listar captações." });
  }
};

export const getDetails = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params; // Pegando o ID da URL

  try {
    // Buscar a captação pelo ID, incluindo os itens relacionados
    const captacao = await Captacao.findOne({
      where: { id },
      include: [
        {
          model: CaptacaoItens,
          as: "itens", // Alias para a associação
        },
      ],
    });

    if (!captacao) {
      return res.status(404).json({ error: "Captação não encontrada." });
    }

    // Retornar os detalhes da captação
    return res.status(200).json({
      data: captacao,
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes da captação:", error);
    return res.status(500).json({ error: "Erro interno ao buscar os detalhes da captação." });
  }
};

// Validação do corpo da requisição para garantir que captacaoId seja fornecido
const schema = Yup.object().shape({
  captacaoId: Yup.number().required("O ID da captação é obrigatório."),
});

export const createContactList = async (req: Request, res: Response): Promise<Response> => {
  const { captacaoId } = req.body;
  const { companyId } = req.user;


  try {
    // Validar a entrada do corpo da requisição
    await schema.validate({ captacaoId });

    // Buscar a captação pelo ID, incluindo os itens relacionados
    const captacao = await Captacao.findOne({
      where: { id: captacaoId },
      include: [
        {
          model: CaptacaoItens,
          as: "itens", // Alias para a associação de itens
        },
      ],
    });

    if (!captacao) {
      return res.status(404).json({ error: "Captação não encontrada." });
    }

    const dataCab = {
      name: captacao.segment,
      companyId: companyId
    }

    // Utilizar o serviço para criar Cab

    const recordCab = await CreateServiceCab({
      ...dataCab,
      companyId
    });

    

    // Criar a lista de contatos a partir dos itens da captação
    const contactList = captacao.itens.map((item: any) => ({
      name: item.Name,
      email: item.Email,
      number: formatPhone(item.Phone),
      companyId: companyId,
      contactListId: recordCab.id
    }));


    for (const contact of contactList) {
      await CreateServiceItem({
        ...contact,
        companyId
      });
    }

    return res.status(200).json({ data: recordCab });


  } catch (error) {
    console.error("Erro ao criar lista de contatos:", error);
    if (error instanceof AppError) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Erro interno ao criar lista de contatos." });
  }
};

const formatPhone = (phone: string | null): string => {
  if (!phone) return '';

  // Remove all non-numeric characters
  let formattedPhone = phone.replace(/\D/g, '');

  // Check if the phone number has the extra '9' after the DDD
  if (formattedPhone.length === 11 && formattedPhone[2] === '9') {
    formattedPhone = formattedPhone.slice(0, 2) + formattedPhone.slice(3);
  }

  // Add the country code '55' at the beginning
  return `55${formattedPhone}`;
};

export const deleteExtraction = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { companyId } = req.user;

    try {
        const captacao = await Captacao.findOne({
            where: { 
                id,
                companyId 
            }
        });

        if (!captacao) {
            return res.status(404).json({ error: "Captação não encontrada." });
        }

        // Deletar os itens relacionados primeiro
        await CaptacaoItens.destroy({
            where: { captacaoId: id }
        });

        // Deletar a captação
        await captacao.destroy();

        return res.status(200).json({ message: "Captação excluída com sucesso." });
    } catch (error) {
        console.error("Erro ao excluir captação:", error);
        return res.status(500).json({ error: "Erro ao excluir captação." });
    }
};