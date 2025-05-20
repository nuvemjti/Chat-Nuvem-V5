import Message from "../../models/Message";

interface Request {
  contactId: number; // Alterado para usar contactId
}

interface Response {
  images: {
    mediaUrl: string;
    mediaType: string;
    pageNumber: number;
    body: string;
  }[];
}

const ListImagesService = async ({
  contactId,
}: Request): Promise<Response> => {

  // Buscando mensagens associadas ao contactId
  const { rows: messages } = await Message.findAndCountAll({
    where: {
      contactId, // Usando contactId para buscar as mensagens
    },
    order: [["createdAt", "DESC"]],
  });

  // Filtrando as mensagens para encontrar apenas imagens
  const images = messages.filter(message =>
    message.mediaType === "image"
  );

  // Mapeando as imagens para formatar os dados
  const media = images.map((message) => ({
    mediaUrl: message.mediaUrl,
    mediaType: message.mediaType,
    pageNumber: Math.ceil((messages.indexOf(message) + 1) / 20),
    body: message.mediaUrl,
  }));

  // Retornando as imagens, invertendo a ordem para as mais recentes aparecerem primeiro
  return {
    images: media.reverse(),
  };
};

export default ListImagesService;
