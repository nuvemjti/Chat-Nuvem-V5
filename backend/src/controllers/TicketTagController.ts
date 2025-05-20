import { Request, Response } from "express";
import AppError from "../errors/AppError";
import TicketTag from "../models/TicketTag";
import Tag from "../models/Tag";
import { getIO } from "../libs/socket";
import Ticket from "../models/Ticket";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import { Op } from "sequelize";

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId, tagId } = req.params;
  const { companyId } = req.user;

  try {

    if (tagId === "empty") {
      // Remove tags antigas do kanban
      await TicketTag.destroy({
        where: {
          ticketId,
          tagId: {
            [Op.in]: (
              await Tag.findAll({ where: { kanban: 1 } })
            ).map(t => t.id)
          }
        }
      });

      const ticket = await ShowTicketService(ticketId, companyId);

      const io = getIO();
      io.of(String(companyId)).emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket
      });

      return res.status(200).json({ message: "Tag vazia" });
    }
    // Verifica se a tag existe e é do tipo kanban
    const tag = await Tag.findOne({
      where: {
        id: tagId,
        companyId,
        kanban: 1
      }
    });

    if (!tag) {
      return res
        .status(404)
        .json({ error: "Tag não encontrada ou não é uma tag do kanban" });
    }

    // Remove tags antigas do kanban
    await TicketTag.destroy({
      where: {
        ticketId,
        tagId: {
          [Op.in]: (await Tag.findAll({ where: { kanban: 1 } })).map(t => t.id)
        }
      }
    });

    // Adiciona nova tag
    const ticketTag = await TicketTag.create({ ticketId, tagId });

    const ticket = await ShowTicketService(ticketId, companyId);

    const io = getIO();
    io.of(String(companyId)).emit(`company-${companyId}-ticket`, {
      action: "update",
      ticket
    });

    return res.status(201).json(ticketTag);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Falha ao adicionar tag ao ticket." });
  }
};

/*
export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;

  console.log("remove");
  console.log(req.params);

  try {
    await TicketTag.destroy({ where: { ticketId } });
    return res.status(200).json({ message: 'Ticket tags removed successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove ticket tags.' });
  }
};
*/
export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const { companyId } = req.user;

  console.log("remove");
  console.log(req.params);

  try {
    // Retrieve tagIds associated with the provided ticketId from TicketTags
    const ticketTags = await TicketTag.findAll({ where: { ticketId } });
    const tagIds = ticketTags.map(ticketTag => ticketTag.tagId);

    // Find the tagIds with kanban = 1 in the Tags table
    const tagsWithKanbanOne = await Tag.findAll({
      where: {
        id: tagIds,
        kanban: 1
      }
    });

    // Remove the tagIds with kanban = 1 from TicketTags
    const tagIdsWithKanbanOne = tagsWithKanbanOne.map(tag => tag.id);
    if (tagIdsWithKanbanOne)
      await TicketTag.destroy({
        where: { ticketId, tagId: tagIdsWithKanbanOne }
      });

    const ticket = await ShowTicketService(ticketId, companyId);

    const io = getIO();
    io.of(String(companyId))
      // .to(ticket.status)
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket
      });
    return res
      .status(200)
      .json({ message: "Ticket tags removed successfully." });
  } catch (error) {
    return res.status(500).json({ error: "Failed to remove ticket tags." });
  }
};
