import TicketNote from "../../models/TicketNote";
import User from "../../models/User";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";

interface Params {
  contactId: number | string;
}

const FindNotesByContactId = async ({
  contactId
}: Params): Promise<TicketNote[]> => {
  // Buscar as notas associadas ao contato, independentemente do ticket
  const notes: TicketNote[] = await TicketNote.findAll({
    where: {
      contactId, // Agora busca apenas pelo contactId
    },
    include: [
      { model: User, as: "user", attributes: ["id", "name", "email"] },
      { model: Contact, as: "contact", attributes: ["id", "name"] },
      { model: Ticket, as: "ticket", attributes: ["id", "status", "createdAt"] }
    ],
    order: [["createdAt", "DESC"]] // Ordena as notas pela data de criação, da mais recente para a mais antiga
  });

  return notes;
};

export default FindNotesByContactId;
