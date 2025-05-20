import GetTicketWhatsapp from "../../../../helpers/GetTicketWhatsapp";
import Message from "../../../../models/Message";
import Ticket from "../../../../models/Ticket";
import formatBody from "../../../../helpers/Mustache";
import { sendwabaText } from "../../API/graphAPi";
import { verifyMessage } from "../../../WbotServices/wbotMessageListener";
import { WAMessage } from "@whiskeysockets/baileys";
import AppError from "../../../../errors/AppError";

interface Params {
  body: string;
  ticket: Ticket;
  quotedMsg?: Message;
}


export const sendWabaTextMessage = async ({
  body,
  ticket,
  quotedMsg
}: Params): Promise<any> => {
  const { number } = ticket.contact;
  const whatsapp = await GetTicketWhatsapp(ticket)
  console.log(" [WABA] \n", quotedMsg)

  try {
    const formattedBody = body ? formatBody(body, ticket) : "";

    // Prepara os dados para o reply se houver uma mensagem citada
    let context = null;
    if (quotedMsg) {
      const messageToReply = await Message.findOne({
        where: {
          id: quotedMsg.id
        }
      });

      if (messageToReply) {
        context = {
          message_id: messageToReply.wid
        };
      }
    }

    const sentMsg = await sendwabaText(
      number,
      formattedBody,
      whatsapp.officialAccessToken,
      whatsapp.officialPhoneNumberId,
      context // Adiciona o contexto do reply se existir
    );

    const sendMsg = {
      key: {
        fromMe: true,
        id: sentMsg.messages[0].id
      },
      message: {
        conversation: formattedBody
      }
    } as WAMessage;

    await ticket.update({ lastMessage: formattedBody });
    await verifyMessage(sendMsg, ticket, ticket.contact);
  } catch (err) {
    console.log(err);
    throw new AppError("ERR_SENDING_WHATSAPP_MSG");
  }
};
