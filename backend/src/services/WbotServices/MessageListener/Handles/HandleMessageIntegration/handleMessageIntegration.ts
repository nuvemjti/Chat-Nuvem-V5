import { proto, WASocket } from "@whiskeysockets/baileys";
import axios from "axios";
import QueueIntegrations from "../../../../../models/QueueIntegrations";
import Ticket from "../../../../../models/Ticket";
import Contact from "../../../../../models/Contact";
import { verifyMessage } from "../../../wbotMessageListener";
import typebotListener from "../../../../TypebotServices/typebotListener";
import { flowBuilderIntegration } from "../../FlowBuilder";
import formatBody from "../../../../../helpers/Mustache"
import Whatsapp from "../../../../../models/Whatsapp";

type Session = WASocket & {
  id?: number;
};


type MessageContentWithText = {
  type: 'text';
  text: {
    value: string;
  };
};

export const handleMessageIntegration = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
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

  else if (queueIntegration.type === "n8n") {
    return
  }
  else if (queueIntegration.type === "webhook") {
    console.log("estou na integracao/webhook");
    try {
        if (!queueIntegration?.urlN8N) {
            console.log("URL do webhook não configurada");
            return false;
        }

        // Garantir que temos o contact, seja pelo parâmetro ou pelo ticket
        const contactInfo = contact || ticket.contact;
        
        if (!contactInfo) {
            console.error("Contato não encontrado");
            return false;
        }

        const options = {
            method: "POST",
            url: queueIntegration.urlN8N,
            headers: {
                "Content-Type": "application/json"
            },
            data: {
                message: msg
            }
        };

        const response = await axios(options);
        console.log(response.data);
        
        await ticket.update({
            useIntegration: true,
            amountUsedBotQueues: ticket.amountUsedBotQueues + 1
        });

        if (queueValues && queueValues.length > 0) {
            console.log("Filas disponíveis:", queueValues);
            const body = formatBody(`\u200e${ticket.queue.greetingMessage}`, ticket);
            const sentMessage = await wbot.sendMessage(
                `${contactInfo.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                {
                    text: body
                }
            );
            console.log("Mensagem enviada");
            await verifyMessage(sentMessage, ticket, contactInfo);
        }
        return true;
    } catch (error) {
        console.error(`Erro ao integrar com webhook: ${error.message}`);
        console.error(`Stack trace: ${error.stack}`);
        return false;
    }
  }
  else if (queueIntegration.type === "typebot") {
    console.trace("entrando no typebot!");
     await typebotListener({
      ticket,
      msg,
      wbot,
      typebot: queueIntegration,
    });
  } else if (queueIntegration.type === "flowbuilder") {
    console.log(105, "handleMessageIntegration")
    
    const companyId = ticket.companyId;
    await flowBuilderIntegration(
      whatsapp,
      msg,
      wbot,
      companyId,
      queueIntegration,
      ticket,
      contact,
      isFirstMsg);
  }
  return true;
};