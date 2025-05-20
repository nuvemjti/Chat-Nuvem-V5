import moment from "moment";
import * as Sentry from "@sentry/node";
import { Op } from "sequelize";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import Queue from "../../models/Queue";
import ShowTicketService from "./ShowTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import FindOrCreateATicketTrakingService from "./FindOrCreateATicketTrakingService";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { verifyMessage } from "../WbotServices/wbotMessageListener";
import { isNil } from "lodash";
import sendFaceMessage from "../FacebookServices/sendFacebookMessage";
import { verifyMessageFace } from "../FacebookServices/facebookMessageListener";
import ShowUserService from "../UserServices/ShowUserService";
import User from "../../models/User";
import CompaniesSettings from "../../models/CompaniesSettings";
import CreateLogTicketService from "./CreateLogTicketService";
import TicketTag from "../../models/TicketTag";
import Tag from "../../models/Tag";
import CreateMessageService from "../MessageServices/CreateMessageService";
import FindOrCreateTicketService from "./FindOrCreateTicketService";
import formatBody from "../../helpers/Mustache";
import { Mutex } from "async-mutex";

import Whatsapp from "../../models/Whatsapp";
import { sendWabaTextMessage } from "../MetaServices/WabaService/SendMessages/sendWabaTextMessage";

interface TicketData {
  status?: string;
  userId?: number | null;
  queueId?: number | null;
  isBot?: boolean;
  queueOptionId?: number;
  sendFarewellMessage?: boolean;
  amountUsedBotQueues?: number;
  lastMessage?: string;
  integrationId?: number;
  useIntegration?: boolean;
  unreadMessages?: number;
  msgTransfer?: string;
  isTransfered?: boolean;
  value?: number;
  productSku?: string;
}

interface Request {
  ticketData: TicketData;
  ticketId: string | number;
  companyId: number;
}

interface Response {
  ticket: Ticket | null;
  oldStatus: string | null;
  oldUserId: number | undefined;
}

const UpdateTicketService = async ({
  ticketData,
  ticketId,
  companyId
}: Request): Promise<Response> => {
  try {
    let {
      queueId,
      userId,
      sendFarewellMessage = true,
      amountUsedBotQueues,
      lastMessage,
      integrationId,
      useIntegration,
      unreadMessages,
      msgTransfer,
      isTransfered = false,
      status,
      value,
      productSku
    } = ticketData;
    let isBot: boolean | null = ticketData.isBot || false;
    let queueOptionId: number | null = ticketData.queueOptionId || null;

    const io = getIO();

    const settings = await CompaniesSettings.findOne({
      where: {
        companyId: companyId
      }
    });

    let ticket = await ShowTicketService(ticketId, companyId);

    if (!ticket) {
      console.error("Ticket não encontrado:", ticketId);
      return { ticket: null, oldStatus: null, oldUserId: null };
    }

    if (ticket.channel === "whatsapp" && ticket.whatsappId) {
      SetTicketMessagesAsRead(ticket);
    }

    const oldStatus = ticket?.status;
    const oldUserId = ticket.user?.id;
    const oldQueueId = ticket?.queueId;

    if (isNil(ticket.whatsappId) && status === "closed") {
      await CreateLogTicketService({
        userId,
        queueId: ticket.queueId,
        ticketId,
        type: "closed",
        
      });

      await ticket.update({
        status: "closed",
        value: value || 0,
        productSku: productSku || "",
        flowWebhook: false,
        typebotStatus: false,
        lastFlowId: "",
        flowStopped: "",
        hashFlowId: ""
      });

      io.of(String(companyId)).emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticketId: ticket.id
      });
      console.log(117, "UpdateTicketService");
      return { ticket, oldStatus, oldUserId };
    }

    if (oldStatus === "closed") {
      console.log(122, "UpdateTicketService");
      let otherTicket = await Ticket.findOne({
        where: {
          contactId: ticket.contactId,
          status: { [Op.or]: ["open", "pending", "group"] },
          whatsappId: ticket.whatsappId
        }
      });
      if (otherTicket) {
        if (otherTicket.id !== ticket.id) {
          otherTicket = await ShowTicketService(otherTicket.id, companyId);
          return { ticket: otherTicket, oldStatus, oldUserId };
        }
      }

      // await CheckContactOpenTickets(ticket.contactId, ticket.whatsappId );
      isBot = false;
    }

    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId,
      companyId,
      whatsappId: ticket?.whatsappId
    });
    // console.log("GETTING WHATSAPP UPDATE TICKETSERVICE", ticket?.whatsappId)
    const { complationMessage, ratingMessage, groupAsTicket } =
      await ShowWhatsAppService(
        ticket?.whatsappId,

        companyId
      );

    if (status !== undefined && ["closed"].indexOf(status) > -1) {
      const _userId = ticket.userId || userId;
      let user;
      if (_userId) {
        user = await User.findByPk(_userId);
      }

      // Lógica para enviar o ratingMessage se o ticket estiver aberto e userRating estiver habilitado
      if (
        settings.userRating === "enabled" &&
        ticket.status === "open" &&
        !ticketTraking.ratingAt &&
        (sendFarewellMessage || sendFarewellMessage === undefined)
      ) {
        // Recupera o whatsappId do ticket
        const whatsappId = ticket.whatsappId;

        // Busca o ratingMessage na tabela Whatsapps
        const whatsapp = await Whatsapp.findOne({ where: { id: whatsappId } });

        // Verifica se o ratingMessage está configurado
        const ratingMessage = whatsapp?.ratingMessage;

        if (ratingMessage) {
          let ratingBody = `\u200e ${ratingMessage}`;

          if (
            ticket.channel === "whatsapp" &&
            ticket.whatsapp.status === "CONNECTED"
          ) {
            const sentMessage = await SendWhatsAppMessage({
              body: ratingBody,
              ticket,
              isForwarded: false
            });
            await verifyMessage(sentMessage, ticket, ticket.contact);
          }

          if (
            ticket.channel === "official" &&
            ticket.whatsapp.status === "CONNECTED"
          ) {
            const sentMessage = await sendWabaTextMessage({
              body: ratingBody,
              ticket,
              quotedMsg: null
            });
            await verifyMessage(sentMessage, ticket, ticket.contact);
          }
          if (["facebook", "instagram"].includes(ticket.channel)) {
            await sendFaceMessage({ body: ratingBody, ticket });
          }

          // Muda o status para NPS e aguarda avaliação
          await ticket.update({
            status: "nps",
            value: value || 0,
            productSku: productSku || ""
          });

          // Atualiza o tracking do ticket com o tempo
          await ticketTraking.update({
            userId: ticket.userId,
            closedAt: moment().toDate()
          });

          io.of(String(companyId)).emit(`company-${ticket.companyId}-ticket`, {
            action: "delete",
            ticketId: ticket.id
          });

          return { ticket, oldStatus, oldUserId };
        } else {
          // Se a coluna ratingMessage estiver vazia, você pode enviar um fallback ou não fazer nada
          console.log("ratingMessage não encontrado para o whatsappId");
        }
      }

      // Lógica para quando o userRating estiver desabilitado ou se o ticket estiver pendente
      if (
        (settings.userRating === "disabled" || ticket.status === "pending") &&
        (sendFarewellMessage || sendFarewellMessage === undefined)
      ) {
        const farewellMessage = user?.farewellMessage || complationMessage;
        let farewellBody = `\u200e ${farewellMessage}`;

        if (
          farewellMessage !== "" &&
          ticket.channel === "whatsapp" &&
          ticket.whatsapp.status === "CONNECTED"
        ) {
          const sentMessage = await SendWhatsAppMessage({
            body: farewellBody,
            ticket,
            isForwarded: false
          });
          await verifyMessage(sentMessage, ticket, ticket.contact);
        }

        if (["facebook", "instagram"].includes(ticket.channel)) {
          await sendFaceMessage({ body: farewellBody, ticket });
        }

        // Finaliza o ticket e o marca como fechado
        await ticket.update({
          status: "closed",
          value: value || 0,
          productSku: productSku || "",
          flowWebhook: false,
          typebotStatus: false,
          lastFlowId: "",
          flowStopped: "",
          hashFlowId: ""
        });

        await ticketTraking.update({
          userId: ticket.userId,
          closedAt: moment().toDate(),
          finishedAt: moment().toDate()
        });

        io.of(String(companyId)).emit(`company-${ticket.companyId}-ticket`, {
          action: "delete",
          ticketId: ticket.id
        });

        return { ticket, oldStatus, oldUserId };
      }

      // Lógica final para fechar o ticket com despedida ou conclusão, independente do estado de userRating
      ticketTraking.finishedAt = moment().toDate();
      ticketTraking.closedAt = moment().toDate();
      ticketTraking.whatsappId = ticket?.whatsappId;
      ticketTraking.userId = ticket.userId;

      await CreateLogTicketService({
        userId,
        queueId: ticket.queueId,
        ticketId,
        type: "closed"
      });

      await ticketTraking.save();

      await ticket.update({
        status: "closed",
        value: value || 0,
        productSku: productSku || ""
      });

      io.of(String(companyId)).emit(`company-${ticket.companyId}-ticket`, {
        action: "delete",
        ticketId: ticket.id
      });

      return { ticket, oldStatus, oldUserId };
    }
    let queue;
    if (!isNil(queueId)) {
      queue = await Queue.findByPk(queueId);
      ticketTraking.queuedAt = moment().toDate();
    }

    if (isTransfered) {
      if (settings.closeTicketOnTransfer) {
        let newTicketTransfer = ticket;
        if (oldQueueId !== queueId) {
          await ticket.update({
            status: "closed",
            value: value || 0,
            productSku: productSku || ""
          });

          await ticket.reload();

          io.of(String(companyId)).emit(`company-${ticket.companyId}-ticket`, {
            action: "delete",
            ticketId: ticket.id
          });

          newTicketTransfer = await FindOrCreateTicketService(
            ticket.contact,
            ticket.whatsapp,
            1,
            ticket.companyId,
            queueId,
            userId,
            null,
            ticket.channel,
            false,
            false,
            settings,
            isTransfered
          );

          await FindOrCreateATicketTrakingService({
            ticketId: newTicketTransfer.id,
            companyId,
            whatsappId: ticket.whatsapp.id,
            userId
          });
        }

        if (!isNil(msgTransfer)) {
          const messageData = {
            wid: `PVT${newTicketTransfer.updatedAt
              .toString()
              .replace(" ", "")}`,
            ticketId: newTicketTransfer.id,
            contactId: undefined,
            body: msgTransfer,
            fromMe: true,
            mediaType: "extendedTextMessage",
            read: true,
            quotedMsgId: null,
            ack: 2,
            remoteJid: newTicketTransfer.contact?.remoteJid,
            participant: null,
            dataJson: null,
            ticketTrakingId: null,
            isPrivate: true
          };

          await CreateMessageService({
            messageData,
            companyId: ticket.companyId
          });
        }

        await newTicketTransfer.update({
          queueId,
          userId,
          status
        });

        await newTicketTransfer.reload();

        if (settings.sendMsgTransfTicket === "enabled") {
          // Mensagem de transferencia da FILA
          if (
            (oldQueueId !== queueId || oldUserId !== userId) &&
            !isNil(oldQueueId) &&
            !isNil(queueId) &&
            !isNil(queueId) &&
            ticket.whatsapp.status === "CONNECTED"
          ) {
            const wbot = await GetTicketWbot(ticket);
            const msgtxt = formatBody(
              `\u200e ${settings.transferMessage.replace(
                "${queue.name}",
                queue?.name
              )}`,
              ticket
            );

            const queueChangedMessage = await wbot.sendMessage(
              `${ticket.contact.number}@${
                ticket.isGroup ? "g.us" : "s.whatsapp.net"
              }`,
              {
                text: msgtxt
              }
            );
            await verifyMessage(
              queueChangedMessage,
              ticket,
              ticket.contact,
              ticketTraking
            );
          }
        }

        if (
          oldUserId !== userId &&
          oldQueueId === queueId &&
          !isNil(oldUserId) &&
          !isNil(userId)
        ) {
          //transferiu o atendimento para fila
          await CreateLogTicketService({
            userId: oldUserId,
            queueId: oldQueueId,
            ticketId,
            type: "transfered"
          });
        } else if (
          oldUserId !== userId &&
          oldQueueId === queueId &&
          !isNil(oldUserId) &&
          !isNil(userId)
        ) {
          //transferiu o atendimento para atendente na mesma fila
          await CreateLogTicketService({
            userId: oldUserId,
            queueId: oldQueueId,
            ticketId,
            type: "transfered"
          });
          //recebeu atendimento
          await CreateLogTicketService({
            userId,
            queueId: oldQueueId,
            ticketId: newTicketTransfer.id,
            type: "receivedTransfer"
          });
        } else if (
          oldUserId !== userId &&
          oldQueueId !== queueId &&
          !isNil(oldUserId) &&
          !isNil(userId)
        ) {
          //transferiu o atendimento para fila e atendente

          await CreateLogTicketService({
            userId: oldUserId,
            queueId: oldQueueId,
            ticketId,
            type: "transfered"
          });
          //recebeu atendimento
          await CreateLogTicketService({
            userId,
            queueId,
            ticketId: newTicketTransfer.id,
            type: "receivedTransfer"
          });
        } else if (
          oldUserId !== undefined &&
          isNil(userId) &&
          oldQueueId !== queueId &&
          !isNil(queueId)
        ) {
          await CreateLogTicketService({
            userId: oldUserId,
            queueId: oldQueueId,
            ticketId,
            type: "transfered"
          });
        }

        if (
          newTicketTransfer.status !== oldStatus ||
          newTicketTransfer.user?.id !== oldUserId
        ) {
          await ticketTraking.update({
            userId: newTicketTransfer.userId
          });

          io.of(String(companyId)).emit(`company-${companyId}-ticket`, {
            action: "delete",
            ticketId: newTicketTransfer.id
          });
        }

        io.of(String(companyId)).emit(`company-${companyId}-ticket`, {
          action: "update",
          ticket: newTicketTransfer
        });

        return { ticket: newTicketTransfer, oldStatus, oldUserId };
      } else {
        if (settings.sendMsgTransfTicket === "enabled") {
          // Mensagem de transferencia da FILA
          if (
            oldQueueId !== queueId ||
            (oldUserId !== userId &&
              !isNil(oldQueueId) &&
              !isNil(queueId) &&
              ticket.whatsapp.status === "CONNECTED")
          ) {
            const wbot = await GetTicketWbot(ticket);
            const msgtxt = formatBody(
              `\u200e ${settings.transferMessage.replace(
                "${queue.name}",
                queue?.name
              )}`,
              ticket
            );

            const queueChangedMessage = await wbot.sendMessage(
              `${ticket.contact.number}@${
                ticket.isGroup ? "g.us" : "s.whatsapp.net"
              }`,
              {
                text: msgtxt
              }
            );
            await verifyMessage(
              queueChangedMessage,
              ticket,
              ticket.contact,
              ticketTraking
            );
          }
        }

        if (!isNil(msgTransfer)) {
          const messageData = {
            wid: `PVT${ticket.updatedAt.toString().replace(" ", "")}`,
            ticketId: ticket.id,
            contactId: undefined,
            body: msgTransfer,
            fromMe: true,
            mediaType: "extendedTextMessage",
            read: true,
            quotedMsgId: null,
            ack: 2,
            remoteJid: ticket.contact?.remoteJid,
            participant: null,
            dataJson: null,
            ticketTrakingId: null,
            isPrivate: true
          };

          await CreateMessageService({
            messageData,
            companyId: ticket.companyId
          });
        }

        if (
          oldUserId !== userId &&
          oldQueueId === queueId &&
          !isNil(oldUserId) &&
          !isNil(userId)
        ) {
          //transferiu o atendimento para fila
          await CreateLogTicketService({
            userId: oldUserId,
            queueId: oldQueueId,
            ticketId,
            type: "transfered"
          });
        } else if (
          oldUserId !== userId &&
          oldQueueId === queueId &&
          !isNil(oldUserId) &&
          !isNil(userId)
        ) {
          //transferiu o atendimento para atendente na mesma fila
          await CreateLogTicketService({
            userId: oldUserId,
            queueId: oldQueueId,
            ticketId,
            type: "transfered"
          });
          //recebeu atendimento
          await CreateLogTicketService({
            userId,
            queueId: oldQueueId,
            ticketId: ticket.id,
            type: "receivedTransfer"
          });
        } else if (
          oldUserId !== userId &&
          oldQueueId !== queueId &&
          !isNil(oldUserId) &&
          !isNil(userId)
        ) {
          //transferiu o atendimento para fila e atendente

          await CreateLogTicketService({
            userId: oldUserId,
            queueId: oldQueueId,
            ticketId,
            type: "transfered"
          });
          //recebeu atendimento
          await CreateLogTicketService({
            userId,
            queueId,
            ticketId: ticket.id,
            type: "receivedTransfer"
          });
        } else if (
          oldUserId !== undefined &&
          isNil(userId) &&
          oldQueueId !== queueId &&
          !isNil(queueId)
        ) {
          await CreateLogTicketService({
            userId: oldUserId,
            queueId: oldQueueId,
            ticketId,
            type: "transfered"
          });
        }
      }
    }

    status = queue && queue.closeTicket ? "closed" : status;

    await ticket.update({
      status,
      queueId,
      userId,
      isBot,
      queueOptionId,
      amountUsedBotQueues:
        status === "closed"
          ? 0
          : amountUsedBotQueues
          ? amountUsedBotQueues
          : ticket.amountUsedBotQueues,
      lastMessage: lastMessage ? lastMessage : ticket.lastMessage,
      useIntegration,
      integrationId,
      typebotSessionId: !useIntegration ? null : ticket.typebotSessionId,
      typebotStatus: useIntegration,
      unreadMessages,
      value: value || 0,
      productSku: productSku || ""
    });

    ticketTraking.queuedAt = moment().toDate();
    ticketTraking.queueId = queueId;

    await ticket.reload();

    if (
      status !== undefined &&
      ["pending"].indexOf(status) > -1 &&
      !isNil(oldUserId)
    ) {
      //validação tickets com status pendente --> Igor
      //ticket voltou para fila
      await CreateLogTicketService({
        userId: oldUserId,
        ticketId,
        type: "pending"
      });

      await ticketTraking.update({
        whatsappId: ticket.whatsappId,
        startedAt: null,
        userId: null
      });
    }

    if (status === "open") {
      console.log("a");
      await ticketTraking.update({
        startedAt: moment().toDate(),
        ratingAt: null,
        rated: false,
        whatsappId: ticket.whatsappId,
        userId: ticket.userId,
        queueId: ticket.queueId
      });

      //loga inicio de atendimento
      await CreateLogTicketService({
        userId: userId,
        queueId: ticket.queueId,
        ticketId,
        type: oldStatus === "pending" ? "open" : "reopen"
      });
    }

    await ticketTraking.save();

    if (
      ticket.status !== oldStatus ||
      ticket.user?.id !== oldUserId ||
      ticket.queueId !== oldQueueId
    ) {
      io.of(String(companyId)).emit(`company-${companyId}-ticket`, {
        action: "delete",
        ticketId: ticket.id
      });
    }

    io.of(String(companyId)).emit(`company-${companyId}-ticket`, {
      action: "update",
      ticket
    });

    return { ticket, oldStatus, oldUserId };
  } catch (err) {
    console.log(
      "erro ao atualizar o ticket",
      ticketId,
      "ticketData",
      ticketData
    );
    Sentry.captureException(err);
  }
};

export default UpdateTicketService;
