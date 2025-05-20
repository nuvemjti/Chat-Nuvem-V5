import { Op } from "sequelize";
import Chat from "../../models/Chat";
import ChatUser from "../../models/ChatUser";
import User from "../../models/User";

interface Request {
  ownerId: number;
  pageNumber?: string;
}

interface Response {
  records: Chat[];
  count: number;   // A quantidade total de chats
  hasMore: boolean; // Se há mais chats a serem carregados
}

const ListService = async ({
  ownerId,
  pageNumber = "1"
}: Request): Promise<Response> => {
  // Obtenção dos chats associados ao ownerId
  const chatUsers = await ChatUser.findAll({
    where: { userId: ownerId }
  });

  const chatIds = chatUsers.map(chat => chat.chatId); // IDs dos chats do owner

  const offset = 0;  // Sem limite, começamos do offset 0

  // Query para buscar os chats e contar a quantidade total
  const { count, rows: records } = await Chat.findAndCountAll({
    where: {
      id: {
        [Op.in]: chatIds // Filtra chats associados ao ownerId
      }
    },
    include: [
      { model: User, as: "owner" }, // Inclusão de dados do owner
      { model: ChatUser, as: "users", include: [{ model: User, as: "user" }] } // Inclusão de usuários do chat
    ],
    offset, // Aplica o deslocamento (agora sempre 0)
    order: [["createdAt", "DESC"]] // Ordena pela data de criação
  });

  // Como não há limite, não precisamos da verificação de "hasMore"
  const hasMore = count > offset + records.length;

  return {
    records, // Registros de chats
    count,    // Total de chats disponíveis
    hasMore   // Indicação se há mais chats
  };
};

export default ListService;
