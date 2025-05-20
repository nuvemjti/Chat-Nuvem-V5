import { proto } from "@whiskeysockets/baileys";
import { IConnections, INodes } from "../../WebhookService/DispatchWebHookService";
import Ticket from "../../../models/Ticket";
import { getBodyMessage } from "../wbotMessageListener";
import { FlowBuilderModel } from "../../../models/FlowBuilder";
import { ActionsWebhookService } from "../../WebhookService/ActionsWebhookService";

export const flowBuilderQueue = async (
  whatsappId: number,
  data: INodes,
  ticket: Ticket,
  msg: proto.IWebMessageInfo,
  companyId: number,
  contact: { number: string; name: string; email: string }
) => {
  const body = getBodyMessage(msg);

  console.log("===== flowBuilderQueue ====", data);

  try {
    const flow = await FlowBuilderModel.findOne({
      where: {
        id: data.id
      }
    });

    const mountDataContact = {
      number: contact.number,
      name: contact.name,
      email: contact.email
    };

    const nodes: INodes[] = flow.flow["nodes"];
    const connections: IConnections[] = flow.flow["connections"];

    await ActionsWebhookService(
      whatsappId,
      parseInt(data.id),
      ticket.companyId,
      nodes,
      connections,
      flow.flow["nodes"][0].id,
      null,
      "",
      "",
      null,
      ticket.id,
      mountDataContact,
      msg
    );
  } catch (e) {
    console.log(e);
  }
};