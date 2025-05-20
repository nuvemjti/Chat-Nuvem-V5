import { proto } from "@whiskeysockets/baileys";



// Função para extrair informações de mensagens de reação
export const getReactionMessage = (msg: proto.IWebMessageInfo) => {
  return msg.message?.reactionMessage?.text;
};

// Função para extrair informações de mensagens de adesivo (sticker) 
{/*export const getStickerMessage = (msg: proto.IWebMessageInfo) => {
  return msg.message?.stickerMessage;
}; */}

