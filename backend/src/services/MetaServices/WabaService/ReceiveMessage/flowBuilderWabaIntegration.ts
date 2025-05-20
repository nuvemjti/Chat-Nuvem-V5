import { proto } from "@whiskeysockets/baileys";
import Whatsapp from "../../../../models/Whatsapp";
import QueueIntegrations from "../../../../models/QueueIntegrations";
import Ticket from "../../../../models/Ticket";
import Contact from "../../../../models/Contact";
import { getIO } from "../../../../libs/socket";
import { getBodyMessage, getTypeMessage } from "../../../WbotServices/wbotMessageListener";
import CreateMessageService from "../../../MessageServices/CreateMessageService";
import Queue from "../../../../models/Queue";
import User from "../../../../models/User";
import ShowWhatsAppService from "../../../WhatsappService/ShowWhatsAppService";
import { FlowCampaignModel } from "../../../../models/FlowCampaign";
import { IConnections, INodes } from "../../../WebhookService/DispatchWebHookService";
import { FlowBuilderModel } from "../../../../models/FlowBuilder";
import { ActionsWabaWebhookService } from "../../../WebhookService/ActionsWabaWebhookService";
import differenceInMilliseconds from "date-fns/differenceInMilliseconds";
import Message from "../../../../models/Message";

export const flowBuilderWabaIntegration = async (
  whatsapp: Whatsapp,
  msg: proto.IWebMessageInfo,
  wbot: Whatsapp,
  companyId: number,
  queueIntegration: QueueIntegrations,
  ticket: Ticket,
  contact: Contact,
  isFirstMsg?: Ticket,
  isTranfered?: boolean
) => {
  const io = getIO();
  //const quotedMsg = await verifyQuotedMessage(msg);
  const body = getBodyMessage(msg);


  if (!msg.key.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" }
      ]
    });

    io.to("closed").emit(`company-${ticket.companyId}-ticket`, {
      action: "delete",
      ticket,
      ticketId: ticket.id
    });

    io.to(ticket.status)
      .to(ticket.id.toString())
      .emit(`company-${ticket.companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id
      });
  }

  if (msg.key.fromMe) {
    return;
  }


  const ticketUpdate = await ticket.update({
    lastMessage: body
  });


  const session = await ShowWhatsAppService(whatsapp.id, companyId);

  const listPhrase = await FlowCampaignModel.findAll({
    where: {
      whatsappId: session.id,
    }
  });




  if (
    !isFirstMsg &&
    listPhrase.filter(item => item.phrase === body).length === 0
  ) {
    
    const flow = await FlowBuilderModel.findOne({
      where: {
        id: whatsapp.flowIdWelcome
      }
    });

    if (flow) {

      const nodes: INodes[] = flow.flow["nodes"];
      const connections: IConnections[] = flow.flow["connections"];

      const mountDataContact = {
        number: contact.number,
        name: contact.name,
        email: contact.email
      };

      // const worker = new Worker("./src/services/WebhookService/WorkerAction.ts");

      // // Enviar as variáveis como parte da mensagem para o Worker
      // console.log('DISPARO1')
      // const data = {
      //   idFlowDb: flowUse.flowIdWelcome,
      //   companyId: ticketUpdate.companyId,
      //   nodes: nodes,
      //   connects: connections,
      //   nextStage: flow.flow["nodes"][0].id,
      //   dataWebhook: null,
      //   details: "",
      //   hashWebhookId: "",
      //   pressKey: null,
      //   idTicket: ticketUpdate.id,
      //   numberPhrase: mountDataContact
      // };
      // worker.postMessage(data);
      // worker.on("message", message => {
      //   console.log(`Mensagem do worker: ${message}`);
      // });

      await ActionsWabaWebhookService(
        whatsapp.id,
        whatsapp.flowIdWelcome,
        ticketUpdate.companyId,
        nodes,
        connections,
        flow.flow["nodes"][0].id,
        null,
        "",
        "",
        null,
        ticketUpdate.id,
        mountDataContact,
      );
    }
  }

  const dateTicket = new Date(isFirstMsg ? isFirstMsg.updatedAt : "");
  const dateNow = new Date();
  const diferencaEmMilissegundos = Math.abs(
    differenceInMilliseconds(dateTicket, dateNow)
  );

  //const seisHorasEmMilissegundos = 60 * 60 * 6 * 1000;

  const seisHorasEmMilissegundos = 6 * 10 * 1000;

  //Dispara quando o cara escreve algo que não palavra chave
  if (
    listPhrase.filter(item => item.phrase === body).length === 0 &&
    diferencaEmMilissegundos >= seisHorasEmMilissegundos &&
    isFirstMsg
  ) {
  
    const flow = await FlowBuilderModel.findOne({
      where: {
        id: whatsapp.flowIdNotPhrase
      }
    });

    if (flow) {
      const nodes: INodes[] = flow.flow["nodes"];
      const connections: IConnections[] = flow.flow["connections"];

      const mountDataContact = {
        number: contact.number,
        name: contact.name,
        email: contact.email
      };

      await ActionsWabaWebhookService(
        session.id,
        session.flowIdNotPhrase,
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
      );
    }
  }
  

  if (ticket.flowWebhook) {
    console.log("#2 webhook", ticketUpdate.flowStopped);

    const flow = await FlowBuilderModel.findOne({
      where: {
        id: ticketUpdate.flowStopped
      }
    });

    if (flow) {
      const nodes: INodes[] = flow.flow["nodes"];
      const connections: IConnections[] = flow.flow["connections"];

      const mountDataContact = {
        number: contact.number,
        name: contact.name,
        email: contact.email
      };

      // const worker = new Worker("./src/services/WebhookService/WorkerAction.ts");

      // console.log('DISPARO5')
      // // Enviar as variáveis como parte da mensagem para o Worker
      // const data = {
      //   idFlowDb: parseInt(ticketUpdate.flowStopped),
      //   companyId: ticketUpdate.companyId,
      //   nodes: nodes,
      //   connects: connections,
      //   nextStage: ticketUpdate.lastFlowId,
      //   dataWebhook: null,
      //   details: "",
      //   hashWebhookId: "",
      //   pressKey: body,
      //   idTicket: ticketUpdate.id,
      //   numberPhrase: mountDataContact
      // };
      // worker.postMessage(data);
      // worker.on("message", message => {
      //   console.log(`Mensagem do worker: ${message}`);
      // });

      await ActionsWabaWebhookService(
        session.id,
        parseInt(ticket.flowStopped),
        ticketUpdate.companyId,
        nodes,
        connections,
        ticketUpdate.lastFlowId,
        null,
        "",
        "",
        body,
        ticketUpdate.id,
        mountDataContact,
      );
    }
  }


  // Campaign fluxo
  if (listPhrase.filter(item => item.phrase === body).length !== 0) {
    const flowDispar = listPhrase.filter(item => item.phrase === body)[0];
    const flow = await FlowBuilderModel.findOne({
      where: {
        id: flowDispar.flowId
      }
    });
    const nodes: INodes[] = flow.flow["nodes"];
    const connections: IConnections[] = flow.flow["connections"];

    const mountDataContact = {
      number: contact.number,
      name: contact.name,
      email: contact.email
    };

    await ActionsWabaWebhookService(
      session.id,
      flowDispar.flowId,
      ticket.companyId,
      nodes,
      connections,
      flow.flow["nodes"][0].id,
      null,
      "",
      "",
      null,
      ticket.id,
      mountDataContact
    );
    return;
  }

};
