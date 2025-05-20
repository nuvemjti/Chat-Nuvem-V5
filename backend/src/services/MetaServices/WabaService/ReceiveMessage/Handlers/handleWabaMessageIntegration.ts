import { proto } from "@whiskeysockets/baileys";
import Whatsapp from "../../../../../models/Whatsapp";
import QueueIntegrations from "../../../../../models/QueueIntegrations";
import Ticket from "../../../../../models/Ticket";
import Contact from "../../../../../models/Contact";
import { flowBuilderWabaIntegration } from "../flowBuilderWabaIntegration";

export const handleWabaMessageIntegration = async (
  msg: proto.IWebMessageInfo,
  wbot: Whatsapp,
  queueIntegration: QueueIntegrations,
  ticket: Ticket,
  queueValues?: string[],
  whatsapp?: Whatsapp,
  contact?: Contact,
  isFirstMsg?: Ticket
): Promise<boolean> => {
  if (process.env.CHATBOT_RESTRICT_NUMBER) {
    if (ticket.contact.number != process.env.CHATBOT_RESTRICT_NUMBER) {
      console.log("chatbot desativado!");
      return true;
    }
  }
  if (queueIntegration.type === "flowbuilder") {
    console.log(105, "handleMessageIntegration")
    
    const companyId = ticket.companyId;
    await flowBuilderWabaIntegration(
      whatsapp,
      msg,
      wbot,
      companyId,
      queueIntegration,
      ticket,
      contact,
      isFirstMsg);
  }
  
};