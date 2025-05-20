import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { Op } from "sequelize";

interface Request {
  contactId?: number; // Agora estamos utilizando contactId como parâmetro
}

interface Response {
  media: { mediaUrl: string; mediaType: string }[];
  documents: { url: string; pageNumber: number; body: string }[];
  links: { url: string; pageNumber: number; body: string }[];
  calls: any[];
}

const ListAllMediaService = async ({
  contactId,
}: Request): Promise<Response> => {
  
  // Se contactId não for fornecido, podemos tentar buscar o ticketId da mesma forma, mas nesse caso vamos assumir que contactId é necessário
  if (!contactId) {
    throw new Error("contactId é obrigatório para buscar mídias.");
  }

  const { rows: messages } = await Message.findAndCountAll({
    where: {
      contactId, // Filtrando por contactId
    },
    order: [["createdAt", "DESC"]],
  });

  const media = messages.filter(message => 
    message.mediaType === "image" || message.mediaType === "video"
  );

  const mediaData = media.map((message) => ({
    mediaUrl: message.mediaUrl,
    mediaType: message.mediaType,
  }));

  const documents = messages.filter(message =>
    message.mediaType === "application" || (message.mediaUrl && message.mediaUrl.indexOf('.xml') !== -1)
  );

  const documentsData = documents.map((message) => ({
    url: message.mediaUrl,
    pageNumber: Math.ceil((messages.indexOf(message) + 1) / 20),
    body: message.mediaUrl
  }));

  const urls = messages.filter(message => 
    (/https?:\/\/\S+/i.test(message.body) ||
    /http?:\/\/\S+/i.test(message.body)) && message.mediaType !== 'locationMessage'
  );

  const linksData = urls.map((message, index) => {
    const matches = message.body.match(/https?:\/\/\S+/ig) || message.body.match(/http?:\/\/\S+/ig);
    const urls = matches ? matches : [];
    return urls.map((url) => ({
      url,
      pageNumber: Math.ceil((messages.indexOf(message) + 1) / 20),
      body: message.body,
    }));
  }).flat();

  const calls = messages.filter(message => message.mediaType === "call_log");

  return {
    media: mediaData,
    documents: documentsData,
    links: linksData,
    calls
  };
};

export default ListAllMediaService;