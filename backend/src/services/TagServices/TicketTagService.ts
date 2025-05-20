import { Op } from "sequelize";
import Tag from "../../models/Tag";
import TicketTag from "../../models/TicketTag";
import Ticket from "../../models/Ticket";
import AppError from "../../errors/AppError";
import { getIO } from "../../libs/socket";

interface AddTagRequest {
  ticketId: string | number;
  tagId: string | number;
  companyId: number;
}

interface RemoveTagRequest {
  ticketId: string | number;
  companyId: number;
}

export const addTagToTicket = async ({
  ticketId,
  tagId,
  companyId
}: AddTagRequest): Promise<TicketTag> => {
  const tag = await Tag.findOne({
    where: { 
      id: tagId,
      companyId,
      kanban: 1 // Garante que é uma tag do kanban
    }
  });

  if (!tag) {
    throw new AppError("Tag não encontrada ou não é uma tag do kanban", 404);
  }

  const ticket = await Ticket.findOne({
    where: { 
      id: ticketId,
      companyId
    },
    include: [{
      model: Tag,
      as: "tags"
    }]
  });

  if (!ticket) {
    throw new AppError("Ticket não encontrado", 404);
  }

  // Primeiro, remove TODAS as tags do kanban existentes
  const existingKanbanTags = await TicketTag.findAll({
    where: { ticketId },
    include: [{
      model: Tag,
      where: { kanban: 1 }
    }]
  });

  // Remove todas as tags antigas do kanban
  if (existingKanbanTags.length > 0) {
    await Promise.all(
      existingKanbanTags.map(async (tt) => {
        await tt.destroy();
      })
    );
  }

  // Adiciona a nova tag
  const ticketTag = await TicketTag.create({
    ticketId,
    tagId
  });

  // Recarrega o ticket com as tags atualizadas
  await ticket.reload({
    include: [{
      model: Tag,
      as: "tags",
      attributes: ["id", "name", "color"]
    }]
  });

  // Emite evento de atualização
  const io = getIO();
  io.of(String(companyId)).emit(`company-${companyId}-ticket`, {
    action: "update",
    ticket
  });

  return ticketTag;
};

export const removeTicketTags = async ({
  ticketId,
  companyId
}: RemoveTagRequest): Promise<void> => {
  const ticket = await Ticket.findOne({
    where: { 
      id: ticketId,
      companyId
    }
  });

  if (!ticket) {
    throw new AppError("Ticket não encontrado", 404);
  }

  // Primeiro, encontra todas as tags do kanban associadas ao ticket
  const ticketTags = await TicketTag.findAll({
    where: { ticketId },
    include: [{
      model: Tag,
      where: { kanban: 1 }
    }]
  });

  // Remove as tags do kanban
  if (ticketTags.length > 0) {
    const tagIds = ticketTags.map(tt => tt.tagId);
    await TicketTag.destroy({
      where: { 
        ticketId,
        tagId: {
          [Op.in]: tagIds
        }
      }
    });
  }

  // Recarrega o ticket com as novas tags
  await ticket.reload({
    include: [{
      model: Tag,
      as: "tags",
      attributes: ["id", "name", "color"]
    }]
  });

  // Emite evento de atualização
  const io = getIO();
  io.of(String(companyId)).emit(`company-${companyId}-ticket`, {
    action: "update",
    ticket
  });
};
