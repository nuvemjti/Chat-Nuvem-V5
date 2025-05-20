import { WAMessage } from "@whiskeysockets/baileys";
import { IContacts, Media, TMessage } from "../../../@types/types";
import Whatsapp from "../../../models/Whatsapp";
import { verifyContact } from "../ContactService";
import { delay, isNil, isNull } from "lodash";
import Queue from "../../../models/Queue";
import ShowWhatsAppService from "../../WhatsappService/ShowWhatsAppService";
import cacheLayer from "../../../libs/cache";
import Ticket from "../../../models/Ticket";
import FindOrCreateTicketService from "../../TicketServices/FindOrCreateTicketService";
import VerifyCurrentSchedule from "../../CompanyService/VerifyCurrentSchedule";
import Setting from "../../../models/Setting";
import FindOrCreateATicketTrakingService from "../../TicketServices/FindOrCreateATicketTrakingService";
import Message from "../../../models/Message";
import formatBody from "../../../helpers/Mustache";
import {
  handleRating,
  verifyMessage,
  verifyRating
} from "../../WbotServices/wbotMessageListener";
import UpdateTicketService from "../../TicketServices/UpdateTicketService";
import logger from "../../../utils/logger";
import { verifyWabaDownloadMedia } from "./ReceiveMessage/Verifiers/verifyWabaDownloadMedia";
import { sendWabaTextMessage } from "./SendMessages/sendWabaTextMessage";
import { verifyWabaQueue } from "./ReceiveMessage/Verifiers/verifyWabaQueue";
import { debounce } from "../../../helpers/Debounce";
import * as Sentry from "@sentry/node";
import CompaniesSettings from "../../../models/CompaniesSettings";
import moment from "moment";
import ShowQueueIntegrationService from "../../QueueIntegrationServices/ShowQueueIntegrationService";
import { handleWabaMessageIntegration } from "./ReceiveMessage/Handlers/handleWabaMessageIntegration";
import { Mutex } from "async-mutex";
import Tag from "../../../models/Tag";
import TicketTag from "../../../models/TicketTag";
import { getIO } from "../../../libs/socket";

let outOfHourMessageControl: any[] = [];
let completionMessageControl: any[] = [];
let greetingMessageControl: any[] = [];
let farewellMessageControl: any[] = [];

const wabaMessageContainsMedia = (msg: TMessage): Media | IContacts => {
  return msg.image || msg.audio || msg.video || msg.document;
};

const wabaFormatterBaileysType = (
  type:
    | "audio"
    | "image"
    | "contacts"
    | "document"
    | "text"
    | "video"
    | "template"
) => {
  switch (type) {
    case "audio":
      return "audioMessage";
    case "image":
      return "imageMessage";
    case "contacts":
      return "contactMessage";
    case "document":
      return "documentMessage";
    case "text":
      return "conversation";
    case "video":
      return "videoMessage";
    case "template":
      return "templateMessage";
    default:
      return "unknownMessage";
  }
};

function convertToVCard(message: TMessage): string {
  const name = message.contacts[0].name.formatted_name;
  const phone = message.contacts[0].phones[0]?.phone || "";

  return `BEGIN:VCARD\nFN:${name}\nTEL:${phone}\nEND:VCARD`;
}

export const handleWabaMessage = async (
  session: Whatsapp,
  webhookEvent: any,
  companyId: any
): Promise<any> => {
  let phon_no_id = webhookEvent.changes[0].value.metadata.phone_number_id;
  const phone_number_id =
    webhookEvent.changes[0].value.metadata.phone_number_id;
  const me = webhookEvent.changes[0].value.metadata.display_phone_number;
  const name = webhookEvent.changes[0].value.contacts[0].profile.name;
  const id = webhookEvent.changes[0].value.contacts[0].wa_id;
  const msgContact = {
    name,
    phoneNumber: id,
    first_name: null,
    lastName: null,
    profile_pic: null
  };

  let queueId: number = null;
  let tagsId: number = null;
  let userId: number = null;

  const importing = false;

  const message: TMessage = webhookEvent.changes[0].value
    .messages[0] as TMessage;

  let bodyMessage = message?.text?.body;

  const contact = await verifyContact(msgContact, session, companyId);

  const fromMe = me === contact.number;

  let msg = null;

  const hasMedia = wabaMessageContainsMedia(message);

  if (hasMedia) {
    const keyType = wabaFormatterBaileysType(message.type);

    const value = message[message.type].id || message?.contacts[0];

    msg = {
      key: {
        fromMe: false,
        id: message.id
      },
      message: {
        [keyType]: value
      }
    } as WAMessage;
  } else {
    msg = {
      key: {
        fromMe: false,
        id: message.id
      },
      message: message?.contacts
        ? {
            contactsArrayMessage: {
              contacts: [{ vcard: convertToVCard(message) }]
            }
          }
        : {
            conversation: bodyMessage
          }
    } as WAMessage;
  }

  try {
    session = await Whatsapp.findOne({
      where: {
        officialWppBusinessId: session.officialWppBusinessId
      },
      include: [
        {
          model: Queue,
          as: "queues",
          attributes: ["id", "name", "color", "greetingMessage"]
        }
      ],
      order: [["queues", "id", "ASC"]]
    });

    console.log(138, "WabaMessageListener", msg);

    const whatsapp = await ShowWhatsAppService(session.id!, companyId);
    const { queues } = whatsapp;

    const queueValues = queues.map(queue => queue.name);

    /**
     * @description Inicializa a contagem de mensagens não lidas e atualiza o cache
     * com base na origem da mensagem. Se a mensagem foi enviada pelo bot, a contagem
     * de mensagens não lidas é zerada. Caso contrário, a contagem é incrementada.
     */
    let unreadMessages = 0;
    if (fromMe) {
      await cacheLayer.set(`contacts:${contact.id}:unreads`, "0"); // Zera contagem de mensagens não lidas
    } else {
      const unreads = await cacheLayer.get(`contacts:${contact.id}:unreads`); // Obtém contagem de mensagens não lidas
      unreadMessages = +unreads + 1; // Incrementa contagem
      await cacheLayer.set(
        `contacts:${contact.id}:unreads`,
        `${unreadMessages}` // Atualiza contagem de mensagens não lidas
      );
    }

    const settings = await CompaniesSettings.findOne({
      where: { companyId }
    });

    const enableLGPD = settings.enableLGPD === "enabled";

    const isFirstTicket = await Ticket.findOne({
      where: {
        contactId: contact.id,
        companyId,
        whatsappId: session.id
      }
    });

    console.log(169, "WabaMessageListener", msg);

    /**
     * @description Cria ou encontra um ticket para o contato. Este bloco de código chama a função
     * FindOrCreateTicketService para obter ou criar um ticket com base nas informações do contato,
     * ID do WhatsApp, contagem de mensagens não lidas, ID da empresa, contato do grupo (se houver),
     * status de importação e se a mensagem foi enviada pelo bot.
     */
    const mutex = new Mutex();
    // Inclui a busca de ticket aqui, se realmente não achar um ticket, então vai para o findorcreate
    const ticket = await mutex.runExclusive(async () => {
      const result = await FindOrCreateTicketService(
        contact,
        whatsapp,
        unreadMessages,
        companyId,
        queueId,
        userId,
        null,
        "official",
        false,
        false,
        settings
      );
      return result;
    });

    let bodyRollbackTag = "";
    let bodyNextTag = "";
    let rollbackTag;
    let nextTag;
    let ticketTag = undefined;
    // console.log(ticket.id)
    if (ticket?.company?.plan?.useKanban) {
      ticketTag = await TicketTag.findOne({
        where: {
          ticketId: ticket.id
        }
      });

      if (ticketTag) {
        const tag = await Tag.findByPk(ticketTag.tagId);
        console.log("log... 3033");
        if (tag.nextLaneId) {
          nextTag = await Tag.findByPk(tag.nextLaneId);
          console.log("log... 3036");
          bodyNextTag = nextTag.greetingMessageLane;
        }
        if (tag.rollbackLaneId) {
          rollbackTag = await Tag.findByPk(tag.rollbackLaneId);
          console.log("log... 3041");
          bodyRollbackTag = rollbackTag.greetingMessageLane;
        }
      }
    }

    if (
      ticket.status === "closed" ||
      (unreadMessages === 0 &&
        whatsapp.complationMessage &&
        formatBody(whatsapp.complationMessage, ticket) === bodyMessage)
    ) {
      return;
    }

    if (
      rollbackTag &&
      formatBody(bodyNextTag, ticket) !== bodyMessage &&
      formatBody(bodyRollbackTag, ticket) !== bodyMessage
    ) {
      await TicketTag.destroy({
        where: { ticketId: ticket.id, tagId: ticketTag.tagId }
      });
      await TicketTag.create({ ticketId: ticket.id, tagId: rollbackTag.id });
    }

    /*
        // console.log(msg.message?.editedMessage)
        // console.log(ticket)
        if (msgType === "editedMessage" || msgType === "protocolMessage") {
          const msgKeyIdEdited =
            msgType === "editedMessage"
              ? msg.message.editedMessage.message.protocolMessage.key.id
              : msg.message?.protocolMessage.key.id;
          let bodyEdited = findCaption(msg.message);
    
          console.log("log... 3075");
    
          // console.log("bodyEdited", bodyEdited)
          const io = getIO();
          try {
            const messageToUpdate = await Message.findOne({
              where: {
                wid: msgKeyIdEdited,
                companyId,
                ticketId: ticket.id
              }
            });
    
            if (!messageToUpdate) return;
    
            await messageToUpdate.update({ isEdited: true, body: bodyEdited });
    
            await ticket.update({ lastMessage: bodyEdited });
    
            console.log("log... 3094");
    
            io.of(String(companyId))
              // .to(String(ticket.id))
              .emit(`company-${companyId}-appMessage`, {
                action: "update",
                message: messageToUpdate
              });
    
            io.of(String(companyId))
              // .to(ticket.status)
              // .to("notification")
              // .to(String(ticket.id))
              .emit(`company-${companyId}-ticket`, {
                action: "update",
                ticket
              });
          } catch (err) {
            Sentry.captureException(err);
            logger.error(`Error handling message ack. Err: ${err}`);
          }
          return;
        }


        */

    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId,
      userId,
      whatsappId: whatsapp?.id
    });

    let useLGPD = false;

    try {
      if (!msg.key.fromMe) {
        //MENSAGEM DE FÉRIAS COLETIVAS
        if (
          ticket.status === "nps" &&
          ticketTraking !== null &&
          verifyRating(ticketTraking)
        ) {
          if (!isNaN(parseFloat(bodyMessage))) {
            handleRating(parseFloat(bodyMessage), ticket, ticketTraking, msg);

            await ticketTraking.update({
              ratingAt: moment().toDate(),
              finishedAt: moment().toDate(),
              rated: true
            });

            return;
          } else {
            if (ticket.amountUsedBotQueuesNPS < whatsapp.maxUseBotQueuesNPS) {
              let bodyErrorRating = `\u200eOpção inválida, tente novamente.\n`;
              
             const sentMessage = await sendWabaTextMessage({
                body: bodyErrorRating,
                ticket,
                quotedMsg: null
              })

              verifyMessage(sentMessage, ticket, contact, ticketTraking);

              

              let bodyRatingMessage = `\u200e${whatsapp.ratingMessage}\n`;

              const msg = await sendWabaTextMessage({
                body: bodyRatingMessage,
                ticket
              });

              await verifyMessage(msg, ticket, ticket.contact);

              await ticket.update({
                amountUsedBotQueuesNPS: ticket.amountUsedBotQueuesNPS + 1
              });
            }
            return;
          }
        }

        const isImported = false
        //TRATAMENTO LGPD
        if (enableLGPD && ticket.status === "lgpd" && !isImported) {
          if (
            isNil(ticket.lgpdAcceptedAt) &&
            !isNil(ticket.lgpdSendMessageAt)
          ) {
            let choosenOption: number | null = null;

            if (msg?.message?.conversation) {
              choosenOption = ~~+msg.message?.conversation;
            }

            // Se digitou opção numérica
            if (
              !Number.isNaN(choosenOption) &&
              Number.isInteger(choosenOption) &&
              !isNull(choosenOption) &&
              choosenOption > 0
            ) {
              // Se digitou 1, aceitou o termo e vai pro bot
              if (choosenOption === 1) {
                await contact.update({
                  lgpdAcceptedAt: moment().toDate()
                });

                if (
                  whatsapp?.queues.length === 0 &&
                  !whatsapp.integrationId &&
                  !whatsapp.promptId
                ) {
                  await ticket.update({
                    lgpdAcceptedAt: moment().toDate(),
                    amountUsedBotQueues: 0,
                    status: "pending"
                  });
                } else {
                  await ticket.update({
                    lgpdAcceptedAt: moment().toDate(),
                    amountUsedBotQueues: 0
                  });
                }

                // Verificação da integração ativa
                if (whatsapp.integrationId) {
                  // Aqui inicia o fluxo da integração, se houver integração ativa
                  await ticket.update({
                    status: "pending" // Garantir que o ticket vá para pending quando integração ativa
                  });
                }

                // Se digitou 2, recusou o bot e encerra chamado
              } else if (choosenOption === 2) {
                if (
                  whatsapp.complationMessage !== "" &&
                  whatsapp.complationMessage !== undefined
                ) {
                  const sentMessage = await sendWabaTextMessage({
                    body: `\u200e${whatsapp.complationMessage}`,
                    ticket
                  })

                  verifyMessage(sentMessage, ticket, contact, ticketTraking);
                }

                await ticket.update({
                  status: "closed",
                  amountUsedBotQueues: 0
                });

                await ticketTraking.destroy;

                return;
              } else {
                if (ticket.amountUsedBotQueues < whatsapp.maxUseBotQueues) {
                  await ticket.update({
                    amountUsedBotQueues: ticket.amountUsedBotQueues + 1,
                    lgpdSendMessageAt: null
                  });
                }
              }
            } else {
              if (ticket.amountUsedBotQueues < whatsapp.maxUseBotQueues) {
                await ticket.update({
                  amountUsedBotQueues: ticket.amountUsedBotQueues + 1,
                  lgpdSendMessageAt: null
                });
              }
            }
          }

          if (
            (contact.lgpdAcceptedAt === null ||
              settings?.lgpdConsent === "enabled") &&
            !contact.isGroup &&
            isNil(ticket.lgpdSendMessageAt) &&
            ticket.amountUsedBotQueues <= whatsapp.maxUseBotQueues &&
            !isNil(settings?.lgpdMessage)
          ) {
            /*
            if (hasMedia) {
              mediaSent = await verifyMediaMessage(
                msg,
                ticket,
                contact,
                ticketTraking,
                false,
                false,
                wbot
              );
            } else {
              await verifyMessage(msg, ticket, contact, ticketTraking);
            }

            if (!isNil(settings?.lgpdMessage) && settings.lgpdMessage !== "") {
              const bodyMessageLGPD = formatBody(
                `\u200e${settings?.lgpdMessage}`,
                ticket
              );

              const sentMessage = await wbot.sendMessage(
                `${ticket.contact.number}@${
                  ticket.isGroup ? "g.us" : "s.whatsapp.net"
                }`,
                {
                  text: bodyMessageLGPD
                }
              );

              verifyMessage(sentMessage, ticket, contact, ticketTraking);
            }

            

            if (!isNil(settings?.lgpdLink) && settings?.lgpdLink !== "") {
              const bodyLink = formatBody(
                `\u200e${settings?.lgpdLink}`,
                ticket
              );
              const sentMessage = await wbot.sendMessage(
                `${ticket.contact.number}@${
                  ticket.isGroup ? "g.us" : "s.whatsapp.net"
                }`,
                {
                  text: bodyLink
                }
              );

              await verifyMessage(sentMessage, ticket, contact, ticketTraking);
            }

            await delay(1000);

            const bodyBot = formatBody(
              `\u200eEstou ciente sobre o tratamento dos meus dados pessoais. \n\n*[1]* Sim\n*[2]* Não`,
              ticket
            );

            const sentMessageBot = await wbot.sendMessage(
              `${ticket.contact.number}@${
                ticket.isGroup ? "g.us" : "s.whatsapp.net"
              }`,
              {
                text: bodyBot
              }
            );

            await verifyMessage(sentMessageBot, ticket, contact, ticketTraking);

            await ticket.update({
              lgpdSendMessageAt: moment().toDate(),
              amountUsedBotQueues: ticket.amountUsedBotQueues + 1
            });

            await ticket.reload();

            return;
            */
          }

          if (!isNil(ticket.lgpdSendMessageAt) && isNil(ticket.lgpdAcceptedAt))
            return;
        }

        const isGroup = false;

        if (!isNil(whatsapp.collectiveVacationMessage && !isGroup)) {
          const currentDate = moment();

          if (
            currentDate.isBetween(
              moment(whatsapp.collectiveVacationStart),
              moment(whatsapp.collectiveVacationEnd)
            )
          ) {
            /*
            if (hasMedia) {
              await verifyMediaMessage(
                msg,
                ticket,
                contact,
                ticketTraking,
                false,
                false,
                wbot
              );
            } else {
              await verifyMessage(msg, ticket, contact, ticketTraking);
            }

            wbot.sendMessage(contact.remoteJid, {
              text: whatsapp.collectiveVacationMessage
            });

            */
            return;
          }
        }
      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    console.log(293, "WabaMessageListener", msg);
    console.log(394, "WabaMessageListener:hasMedia", hasMedia);

    /**
     * @description Verifica se a mensagem contém mídia. Se a mensagem contém mídia,
     * chama a função verifyMediaMessage para processar a mensagem de mídia e armazenar
     * o resultado em mediaSent. Caso contrário, chama a função verifyMessage para
     * processar a mensagem normal. Isso garante que tanto mensagens com mídia quanto
     * mensagens de texto sejam tratadas adequadamente.
     */

    if (hasMedia) {
      await verifyWabaDownloadMedia(msg, ticket, session);
    } else {
      await verifyMessage(msg, ticket, contact, ticketTraking, false); // Processa a mensagem normal
    }


    // integração flowbuilder
    if (
      !ticket.imported &&
      !msg.key.fromMe &&
      !ticket.isGroup &&
      !ticket.user &&
      !ticket.queue &&
      !isNil(whatsapp.integrationId) &&
      !ticket.useIntegration
    ) {
      const integrations = await ShowQueueIntegrationService(
        whatsapp.integrationId,
        companyId
      );

      console.log(" Entrei na integração  flowbuilder/2");
      await handleWabaMessageIntegration(
        msg,
        session,
        integrations,
        ticket,
        null,
        whatsapp,
        contact,
        isFirstTicket
      );
    }
  } catch (err) {
    console.log(err);
    logger.error(`Error handling whatsapp message: Err: ${err}`);
  }
};
