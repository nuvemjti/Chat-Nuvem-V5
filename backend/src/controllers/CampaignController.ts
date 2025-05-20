import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { head } from "lodash";
import fs from "fs";
import path from "path";
import * as XLSX from 'xlsx';

import ListService from "../services/CampaignService/ListService";
import CreateService from "../services/CampaignService/CreateService";
import ShowService from "../services/CampaignService/ShowService";
import UpdateService from "../services/CampaignService/UpdateService";
import DeleteService from "../services/CampaignService/DeleteService";
import FindService from "../services/CampaignService/FindService";

import Campaign from "../models/Campaign";

import ContactTag from "../models/ContactTag";
import Ticket from "../models/Ticket";
import Contact from "../models/Contact";
import ContactList from "../models/ContactList";
import ContactListItem from "../models/ContactListItem";

import AppError from "../errors/AppError";
import { CancelService } from "../services/CampaignService/CancelService";
import { RestartService } from "../services/CampaignService/RestartService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  companyId: string | number;
};

type StoreData = {
  name: string;
  status: string;
  confirmation: boolean;
  scheduledAt: string;
  companyId: number;
  contactListId: number;
  tagListId: number | string;
  userId: number | string;
  queueId: number | string;
  statusTicket: string;
  openTicket: string;
};

type FindParams = {
  companyId: string;
};

interface ImportedData {
  leads: number;
  mqls: number;
  agendamentos: number;
  reunioes: number;
  compras: number;
}

interface RowData {
  Status: string;
  Investimento: number;
  'Valor Venda': number;
  'Qualificado MQL': string;
  'Agendou Reunião': string;
  'Realizou Reunião': string;
  'Converteu Venda': string;
  'SQL': string;
  Data: string;
  Origem: string;
  Nome: string;
  Email: string;
  Telefone: string;
}

interface CampaignStats {
  leads: number;
  mqls: number;
  agendamentos: number;
  reunioes: number;
  compras: number;
  investimento: number;
  faturamento: number;
  roas: number;
  taxaConversao: number;
  ticketMedio: number;
  cpl: number;
  custoMql: number;
  custoReuniao: number;
  sqls: number;
  cpa: number;
}

class CampaignController {
  public async index(req: Request, res: Response): Promise<Response> {
    const { searchParam, pageNumber } = req.query as IndexQuery;
    const { companyId } = req.user;

    const { records, count, hasMore } = await ListService({
      searchParam,
      pageNumber,
      companyId
    });

    return res.json({ records, count, hasMore });
  }

  public async store(req: Request, res: Response): Promise<Response> {
    const { companyId } = req.user;
    const data = req.body as StoreData;

    const schema = Yup.object().shape({
      name: Yup.string().required()
    });

    try {
      await schema.validate(data);
    } catch (err: any) {
      throw new AppError(err.message);
    }

    if (typeof data.tagListId === 'number') {

      const tagId = data.tagListId;
      const campanhaNome = data.name;

      async function createContactListFromTag(tagId) {

        const currentDate = new Date();
        const formattedDate = currentDate.toISOString();

        try {
          const contactTags = await ContactTag.findAll({ where: { tagId } });
          const contactIds = contactTags.map((contactTag) => contactTag.contactId);

          const contacts = await Contact.findAll({ where: { id: contactIds } });

          const randomName = `${campanhaNome} | TAG: ${tagId} - ${formattedDate}` // Implement your own function to generate a random name
          const contactList = await ContactList.create({ name: randomName, companyId: companyId });

          const { id: contactListId } = contactList;

          const contactListItems = contacts.map((contact) => ({
            name: contact.name,
            number: contact.number,
            email: contact.email,
            contactListId,
            companyId,
            isWhatsappValid: true,
            isGroup: contact.isGroup

          }));

          await ContactListItem.bulkCreate(contactListItems);

          // Return the ContactList ID
          return contactListId;
        } catch (error) {
          console.error('Error creating contact list:', error);
          throw error;
        }
      }


      createContactListFromTag(tagId)
        .then(async (contactListId) => {
          const record = await CreateService({
            ...data,
            companyId,
            contactListId: contactListId,
          });
          const io = getIO();
          io.of(String(companyId))
            .emit(`company-${companyId}-campaign`, {
              action: "create",
              record
            });
          return res.status(200).json(record);
        })
        .catch((error) => {
          console.error('Error:', error);
          return res.status(500).json({ error: 'Error creating contact list' });
        });

    } else { // SAI DO CHECK DE TAG


      const record = await CreateService({
        ...data,
        companyId
      });

      const io = getIO();
      io.of(String(companyId))
        .emit(`company-${companyId}-campaign`, {
          action: "create",
          record
        });

      return res.status(200).json(record);
    }
  }

  public async show(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    const record = await ShowService(id);

    return res.status(200).json(record);
  }

  public async update(
    req: Request,
    res: Response
  ): Promise<Response> {
    const data = req.body as StoreData;

    const { companyId } = req.user;

    const schema = Yup.object().shape({
      name: Yup.string().required()
    });

    try {
      await schema.validate(data);
    } catch (err: any) {
      throw new AppError(err.message);
    }

    const { id } = req.params;

    const record = await UpdateService({
      ...data,
      id
    });

    const io = getIO();
    io.of(String(companyId))
      .emit(`company-${companyId}-campaign`, {
        action: "update",
        record
      });

    return res.status(200).json(record);
  }

  public async cancel(
    req: Request,
    res: Response
  ): Promise<Response> {
    const { id } = req.params;

    await CancelService(+id);

    return res.status(204).json({ message: "Cancelamento realizado" });
  }

  public async restart(
    req: Request,
    res: Response
  ): Promise<Response> {
    const { id } = req.params;

    await RestartService(+id);

    return res.status(204).json({ message: "Reinício dos disparos" });
  }

  public async remove(
    req: Request,
    res: Response
  ): Promise<Response> {
    const { id } = req.params;
    const { companyId } = req.user;

    await DeleteService(id);

    const io = getIO();
    io.of(String(companyId))
      .emit(`company-${companyId}-campaign`, {
        action: "delete",
        id
      });

    return res.status(200).json({ message: "Campaign deleted" });
  }

  public async findList(
    req: Request,
    res: Response
  ): Promise<Response> {
    const params = req.query as FindParams;
    const records: Campaign[] = await FindService(params);

    return res.status(200).json(records);
  }

  public async mediaUpload(
    req: Request,
    res: Response
  ): Promise<Response> {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    const file = head(files);

    try {
      const campaign = await Campaign.findByPk(id);
      campaign.mediaPath = file.filename;
      campaign.mediaName = file.originalname;
      await campaign.save();
      return res.send({ mensagem: "Mensagem enviada" });
    } catch (err: any) {
      throw new AppError(err.message);
    }
  }

  public async deleteMedia(
    req: Request,
    res: Response
  ): Promise<Response> {
    const { companyId } = req.user;
    const { id } = req.params;

    try {
      const campaign = await Campaign.findByPk(id);
      const filePath = path.resolve("public", `company${companyId}`, campaign.mediaPath);
      const fileExists = fs.existsSync(filePath);
      if (fileExists) {
        fs.unlinkSync(filePath);
      }

      campaign.mediaPath = null;
      campaign.mediaName = null;
      await campaign.save();
      return res.send({ mensagem: "Arquivo excluído" });
    } catch (err: any) {
      throw new AppError(err.message);
    }
  }

  public async importData(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.file) {
        throw new AppError('Nenhum arquivo enviado', 400);
      }

      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<RowData>(worksheet);

      const processedData = {
        investimento: 0,
        faturamento: 0,
        roas: 0,
        taxaConversao: 0,
        ticketMedio: 0,
        leads: 0,
        mqls: 0,
        agendamentos: 0,
        reunioes: 0,
        sqls: 0,
        compras: 0,
        cpl: 0,
        custoMql: 0,
        custoReuniao: 0,
        cpa: 0
      };

      data.forEach((row) => {
        // Acumular valores básicos
        processedData.investimento += Number(row.Investimento) || 0;
        processedData.faturamento += Number(row['Valor Venda']) || 0;
        
        // Contar leads
        if (row.Status?.trim().toLowerCase() === 'lead') {
          processedData.leads++;
        }

        // Contar MQLs
        if (row['Qualificado MQL']?.trim().toLowerCase() === 'sim') {
          processedData.mqls++;
        }

        // Contar agendamentos
        if (row['Agendou Reunião']?.trim().toLowerCase() === 'sim') {
          processedData.agendamentos++;
        }

        // Contar reuniões realizadas
        if (row['Realizou Reunião']?.trim().toLowerCase() === 'sim') {
          processedData.reunioes++;
        }

        // Contar SQLs
        if (row['SQL']?.trim().toLowerCase() === 'sim') {
          processedData.sqls++;
        }

        // Contar compras
        if (row['Converteu Venda']?.trim().toLowerCase() === 'sim') {
          processedData.compras++;
        }
      });

      // Calcular métricas
      processedData.roas = processedData.investimento > 0 ? 
        processedData.faturamento / processedData.investimento : 0;
      
      processedData.taxaConversao = processedData.leads > 0 ? 
        (processedData.compras / processedData.leads) * 100 : 0;
      
      processedData.ticketMedio = processedData.compras > 0 ? 
        processedData.faturamento / processedData.compras : 0;
      
      processedData.cpl = processedData.leads > 0 ? 
        processedData.investimento / processedData.leads : 0;
      
      processedData.custoMql = processedData.mqls > 0 ? 
        processedData.investimento / processedData.mqls : 0;
      
      processedData.custoReuniao = processedData.reunioes > 0 ? 
        processedData.investimento / processedData.reunioes : 0;
      
      processedData.cpa = processedData.compras > 0 ? 
        processedData.investimento / processedData.compras : 0;

      return res.status(200).json(processedData);
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  public async clearData(req: Request, res: Response): Promise<Response> {
    try {
      // Retorna os dados zerados
      const clearedData = {
        investimento: 0,
        faturamento: 0,
        roas: 0,
        taxaConversao: 0,
        ticketMedio: 0,
        leads: 0,
        mqls: 0,
        agendamentos: 0,
        reunioes: 0,
        sqls: 0,
        compras: 0,
        cpl: 0,
        custoMql: 0,
        custoReuniao: 0,
        cpa: 0
      };

      return res.status(200).json(clearedData);
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  public async getStats(req: Request, res: Response): Promise<Response> {
    try {
      // Aqui você deve implementar a lógica para buscar as estatísticas do seu banco de dados
      // Este é um exemplo com dados mockados
      const stats: CampaignStats = {
        leads: 0,
        mqls: 0,
        agendamentos: 0,
        reunioes: 0,
        compras: 0,
        investimento: 0,
        faturamento: 0,
        roas: 0,
        taxaConversao: 0,
        ticketMedio: 0,
        cpl: 0,
        custoMql: 0,
        custoReuniao: 0,
        sqls: 0,
        cpa: 0
      };

      return res.status(200).json(stats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      return res.status(500).json({ error: "Erro ao buscar estatísticas da campanha" });
    }
  }
}

export default new CampaignController();