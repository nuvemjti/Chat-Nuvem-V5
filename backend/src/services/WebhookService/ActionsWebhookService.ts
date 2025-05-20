import AppError from "../../errors/AppError";
import { WebhookModel } from "../../models/Webhook";
import { sendMessageFlow } from "../../controllers/MessageController";
import { IConnections, INodes } from "./DispatchWebHookService";
import Contact from "../../models/Contact";
import CreateTicketService from "../TicketServices/CreateTicketService";
import CreateTicketServiceWebhook from "../TicketServices/CreateTicketServiceWebhook";
import { SendMessage } from "../../helpers/SendMessage";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import fs from "fs";
import GetWhatsappWbot from "../../helpers/GetWhatsappWbot";
import path from "path";
import SendWhatsAppMedia from "../WbotServices/SendWhatsAppMedia";
import SendWhatsAppMediaFlo from "../WbotServices/SendWhatsAppMediaFlow";
import { randomizarCaminho } from "../../utils/randomizador";
import { SendMessageFlow } from "../../helpers/SendMessageFlow";
import formatBody from "../../helpers/Mustache";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import ShowTicketService from "../TicketServices/ShowTicketService";
import CreateMessageService, {
  MessageData
} from "../MessageServices/CreateMessageService";
import { randomString } from "../../utils/randomCode";
import ShowQueueService from "../QueueService/ShowQueueService";
import { getIO } from "../../libs/socket";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import FindOrCreateATicketTrakingService from "../TicketServices/FindOrCreateATicketTrakingService";
import { delay } from "bluebird";
import typebotListener from "../TypebotServices/typebotListener";
import { getWbot } from "../../libs/wbot";
import { proto } from "@whiskeysockets/baileys";
import SendWhatsAppMediaFlow from "../WbotServices/SendWhatsAppMediaFlow";
import { handleOpenAi } from "../IntegrationsServices/OpenAiService";
import { IOpenAi } from "../../@types/openai";
import axios from "axios";

import User from "../../models/User";
import SyncTagService from "../../services/TagServices/SyncTagsService";
import { SendPresenceStatus } from "../WbotServices/SendPresenceStatus";
import { flowBuilderQueue } from "../WbotServices/MessageListener/FlowBuilderQueue";
import logger from "../../utils/logger";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import TicketTag from "../../models/TicketTag";
import Tag from "../../models/Tag";

interface IAddContact {
  companyId: number;
  name: string;
  phoneNumber: string;
  email?: string;
  dataMore?: any;
}

export const ActionsWebhookService = async (
  whatsappId: number,
  idFlowDb: number,
  companyId: number,
  nodes: INodes[],
  connects: IConnections[],
  nextStage: string,
  dataWebhook: any,
  details: any,
  hashWebhookId: string,
  pressKey?: string,
  idTicket?: number,
  numberPhrase: "" | { number: string; name: string; email: string } = "",
  msg?: proto.IWebMessageInfo
): Promise<string> => {
  try {
    const io = getIO();
    let next = nextStage;
    console.log(
      "ActionWebhookService | 53",
      idFlowDb,
      companyId,
      nodes,
      connects,
      nextStage,
      dataWebhook,
      details,
      hashWebhookId,
      pressKey,
      idTicket,
      numberPhrase
    );
    let createFieldJsonName = "";

    const connectStatic = connects;
    if (numberPhrase === "") {
      const nameInput = details.inputs.find(item => item.keyValue === "nome");
      nameInput.data.split(",").map(dataN => {
        const lineToData = details.keysFull.find(item => item === dataN);
        let sumRes = "";
        if (!lineToData) {
          sumRes = dataN;
        } else {
          sumRes = constructJsonLine(lineToData, dataWebhook);
        }
        createFieldJsonName = createFieldJsonName + sumRes;
      });
    } else {
      createFieldJsonName = numberPhrase.name;
    }

    let numberClient = "";

    if (numberPhrase === "") {
      const numberInput = details.inputs.find(
        item => item.keyValue === "celular"
      );

      numberInput.data.split(",").map(dataN => {
        const lineToDataNumber = details.keysFull.find(item => item === dataN);
        let createFieldJsonNumber = "";
        if (!lineToDataNumber) {
          createFieldJsonNumber = dataN;
        } else {
          createFieldJsonNumber = constructJsonLine(
            lineToDataNumber,
            dataWebhook
          );
        }

        numberClient = numberClient + createFieldJsonNumber;
      });
    } else {
      numberClient = numberPhrase.number;
    }

    numberClient = removerNaoLetrasNumeros(numberClient);

    if (numberClient.substring(0, 2) === "55") {
      if (parseInt(numberClient.substring(2, 4)) >= 31) {
        if (numberClient.length === 13) {
          numberClient =
            numberClient.substring(0, 4) + numberClient.substring(5, 13);
        }
      }
    }

    let createFieldJsonEmail = "";

    if (numberPhrase === "") {
      const emailInput = details.inputs.find(item => item.keyValue === "email");
      emailInput.data.split(",").map(dataN => {
        const lineToDataEmail = details.keysFull.find(item =>
          item.endsWith("email")
        );

        let sumRes = "";
        if (!lineToDataEmail) {
          sumRes = dataN;
        } else {
          sumRes = constructJsonLine(lineToDataEmail, dataWebhook);
        }

        createFieldJsonEmail = createFieldJsonEmail + sumRes;
      });
    } else {
      createFieldJsonEmail = numberPhrase.email;
    }

    const lengthLoop = nodes.length;
    const whatsapp = await ShowWhatsAppService(whatsappId, companyId);
    if (whatsapp.status !== "CONNECTED") {
      return;
    }

    let execCount = 0;

    let execFn = "";

    let ticket = null;

    let noAlterNext = false;

    for (var i = 0; i < lengthLoop; i++) {
      let nodeSelected: any;
      let ticketInit: Ticket;
      if (idTicket) {
        ticketInit = await Ticket.findOne({
          where: { id: idTicket }
        });
        if (ticketInit.status === "closed") {
          if (numberPhrase === "") {
            break;
          }
        }
      }

      if (pressKey) {
        if (pressKey === "parar") {
          if (idTicket) {
            const ticket = await Ticket.findOne({
              where: { id: idTicket }
            });
            await ticket.update({
              status: "closed"
            });
          }
          break;
        }

        if (execFn === "") {
          const isOpenai =
            nodes.find((node: any) => node.id === nextStage)?.type === "openai";
          const isQuestion =
            nodes.find((node: any) => node.id === nextStage)?.type ===
            "question";
          const isTypebot =
            nodes.find((node: any) => node.id === nextStage)?.type ===
            "typebot";
          if (isOpenai) {
            nodeSelected = {
              type: "openai"
            };
          } else if (isQuestion) {
            nodeSelected = {
              type: "question"
            };
          } else if (isTypebot) {
            nodeSelected = {
              type: "typebot"
            };
          } else {
            nodeSelected = {
              type: "menu"
            };
          }
        } else {
          console.log("UPDATE6...");
          nodeSelected = nodes.filter(node => node.id === execFn)[0];
        }
      } else {
        const otherNode = nodes.filter(node => node.id === next)[0];
        if (otherNode) {
          nodeSelected = otherNode;
        }
      }

      console.log("======= | NODE SELECTED | =======", nodeSelected, execFn);
      if (nodeSelected.type === "message") {
        let msg;

        const webhook = ticket.dataWebhook;

        msg = {
          body: nodeSelected.data.label
        };

        const ticketDetails = await ShowTicketService(idTicket, companyId);

        await SendPresenceStatus(
          getWbot(whatsapp.id),
          `${ticketDetails.contact.number}@${
            ticket.isGroup ? "g.us" : "s.whatsapp.net"
          }`
        );

        await SendMessage(whatsapp, {
          number: numberClient,
          body: msg.body
        });

        //TESTE BOTÃO
        //await SendMessageFlow(whatsapp, {
        //  number: numberClient,
        //  body: msg.body
        //} )
      }

      let isOpenai: boolean;

      if (nodeSelected.type === "openai") {
        let data = null;

        if (nodeSelected?.data) {
          data = nodeSelected.data?.typebotIntegration as IOpenAi;
        } else {
          const currenNode = nodes.find(nd => nd.id === nextStage);

          data = currenNode.data?.typebotIntegration as unknown as IOpenAi;
          nodeSelected = currenNode;
        }

        let {
          name,
          prompt,
          voice,
          voiceKey,
          voiceRegion,
          maxTokens,
          temperature,
          apiKey,
          queueId,
          maxMessages
        } = data;

        let openAiSettings = {
          name,
          prompt,
          voice,
          voiceKey,
          voiceRegion,
          maxTokens: parseInt(maxTokens),
          temperature: parseInt(temperature),
          apiKey,
          queueId: parseInt(queueId),
          maxMessages: parseInt(maxMessages)
        };

        const contact = await Contact.findOne({
          where: { number: numberClient, companyId: 1 }
        });

        const wbot = await getWbot(whatsapp.id);

        if (ticket) {
          ticket = await Ticket.findOne({
            where: {
              id: ticket.id
            },
            include: [
              { model: Contact, as: "contact", attributes: ["id", "name"] }
            ]
          });
        } else {
          ticket = await Ticket.findOne({
            where: {
              id: idTicket
            },
            include: [
              { model: Contact, as: "contact", attributes: ["id", "name"] }
            ]
          });
        }

        await handleOpenAi(
          openAiSettings,
          msg,
          wbot,
          ticket,
          contact,
          null,
          null
        );

        if (ticket) {
          await ticket.update({
            queueId: ticket.queueId ? ticket.queueId : null,
            userId: null,
            companyId: companyId,
            flowWebhook: true,
            lastFlowId: nodeSelected.id,
            flowStopped: idFlowDb.toString()
          });
        }

        break;
      }

      let isQuestion: boolean;
      let isSwitchFlow: boolean;
      let flow: INodes = null;

      if (nodeSelected.type === "question") {
        if (pressKey) {
          const currenNode = nodes.find(nd => nd.id === nextStage);
          const data = currenNode.data?.typebotIntegration;
          const answerKey = data["answerKey"];
          if (ticket) {
            ticket = await Ticket.findOne({
              where: {
                id: ticket.id
              },
              include: [
                { model: Contact, as: "contact", attributes: ["id", "name"] }
              ]
            });
          } else {
            ticket = await Ticket.findOne({
              where: {
                id: idTicket
              },
              include: [
                { model: Contact, as: "contact", attributes: ["id", "name"] }
              ]
            });
          }

          let dataWebhook = {
            variables: {
              ...(ticket?.dataWebhook?.variables || {}), // Mantém os antigos
              [answerKey]: pressKey // Adiciona o novo dado
            }
          };

          await ticket.update({
            dataWebhook: dataWebhook
          });

          ticket.save();

          const nextNode = connects.find(node => node.source === next);
          console.log(355, { nextNode });
          if (nextNode) {
            execFn = nextNode.target;
          } else {
            execFn = undefined;
          }
          if (execFn === undefined) {
            break;
          }
          // pressKey = "999";
          const isNodeExist = nodes.filter(item => item.id === execFn);
          if (isNodeExist.length > 0) {
            isQuestion = true;
          } else {
            isQuestion = false;
          }
        } else {
          console.log(327, "response", pressKey, execFn);
          const { message, answerKey } = nodeSelected.data.typebotIntegration;

          const ticketDetails = await ShowTicketService(idTicket, companyId);

          await SendPresenceStatus(
            getWbot(whatsapp.id),
            `${ticketDetails.contact.number}@${
              ticket.isGroup ? "g.us" : "s.whatsapp.net"
            }`
          );

          await SendWhatsAppMessage({
            body: message,
            ticket: ticketDetails,
            quotedMsg: null
          });

          SetTicketMessagesAsRead(ticketDetails);

          await ticketDetails.update({
            lastMessage: formatBody(message, ticket.contact)
          });
          if (ticket) {
            ticket = await Ticket.findOne({
              where: {
                id: ticket.id
              },
              include: [
                { model: Contact, as: "contact", attributes: ["id", "name"] }
              ]
            });
          } else {
            ticket = await Ticket.findOne({
              where: {
                id: idTicket
              },
              include: [
                { model: Contact, as: "contact", attributes: ["id", "name"] }
              ]
            });
          }
          if (ticket) {
            await ticket.update({
              queueId: ticket.queueId ? ticket.queueId : null,
              userId: null,
              companyId: companyId,
              flowWebhook: true,
              lastFlowId: nodeSelected.id,
              hashFlowId: hashWebhookId,
              flowStopped: idFlowDb.toString()
            });
          }
          break;
        }
      }

      if (nodeSelected.type === "tagKanban") {
        const { tag } = nodeSelected.data;
        console.log("==== | tag kanban | ===", tag);
        if (ticket) {
          ticket = await Ticket.findOne({
            where: {
              id: ticket.id
            },
            include: [
              { model: Contact, as: "contact", attributes: ["id", "name"] }
            ]
          });
        } else {
          ticket = await Ticket.findOne({
            where: {
              id: idTicket
            },
            include: [
              { model: Contact, as: "contact", attributes: ["id", "name"] }
            ]
          });
        }

        if (ticket && tag?.id) {
          await TicketTag.create({ ticketId: ticket.id, tagId: tag.id });
          io.of(String(companyId))
            // .to(ticket.status)
            .emit(`company-${companyId}-ticket`, {
              action: "update",
              ticket
            });
        }
      }

      if (nodeSelected.type === "tag") {
        const { tag } = nodeSelected.data;
        const ticketDetails = await ShowTicketService(idTicket, companyId);
        let tags = ticketDetails.tags;
        tags = [...tags, tag];

        await SyncTagService({
          contactId: ticketDetails.contact.id,
          tags: tags
        });
      }

      if (nodeSelected.type === "typebot") {
        console.log("275", "typebot", idTicket);
        const wbot = getWbot(whatsapp.id);

        ticket = await Ticket.findOne({
          where: {
            id: idTicket
          },
          include: [
            { model: Contact, as: "contact", attributes: ["id", "name"] }
          ]
        });

        if (nodeSelected?.data) {
          await typebotListener({
            wbot: wbot,
            msg,
            ticket,
            typebot: nodeSelected.data.typebotIntegration
          });
        } else {
          const currenNode = nodes.find(nd => nd.id === nextStage);
          await typebotListener({
            wbot: wbot,
            msg,
            ticket,
            typebot: currenNode.data.typebotIntegration
          });
        }
        if (ticket) {
          await ticket.update({
            flowWebhook: true,
            lastFlowId: nodeSelected.id,
            hashFlowId: hashWebhookId,
            flowStopped: idFlowDb.toString()
          });
        }
        break;
      }
      if (nodeSelected.type === "attendant") {
        const { users } = nodeSelected.data;
        const onlineUsers: User[] = users.filter((u: User) => u.online);
        

        const total = users.length - 1;

        const randomIndex = between(0, total)
        const userTransfer = onlineUsers[randomIndex];

        const ticketDetails = await ShowTicketService(idTicket, companyId);

        await ticketDetails.update({
          userId: userTransfer.id
        });

        await UpdateTicketService({
          ticketData: {
            userId: userTransfer.id
          },
          ticketId: idTicket,
          companyId
        });


      }

      if (nodeSelected.type === "ticket") {
        const { queue } = nodeSelected.data;
        const queueSelected = await ShowQueueService(queue.id, companyId);
        await ticket.update({
          queueId: queueSelected.id,
          companyId: companyId,
          flowWebhook: true,
          lastFlowId: nodeSelected.id,
          hashFlowId: hashWebhookId,
          flowStopped: idFlowDb.toString()
        });

        await FindOrCreateATicketTrakingService({
          ticketId: ticket.id,
          companyId,
          whatsappId: ticket.whatsappId
        });

        await UpdateTicketService({
          ticketData: {
            queueId: queue.id
          },
          ticketId: ticket.id,
          companyId
        });
      }

      let isRandomizer: boolean;

      if (nodeSelected.type === "condition") {
        const { condition, options } = nodeSelected.data;
        const conditionResults = await Promise.all(
          options.map(async option => {
            if (option.type === "TAG") {
              const ticketDetails = await ShowTicketService(
                idTicket,
                companyId
              );
              return evaluateCondition(
                ticketDetails.tags,
                option.primaryCondition,
                option.fieldName
              );
            }
            return false; // Caso algum tipo não seja tratado, retorna `false` por padrão
          })
        );

        const positive =
          condition === "AND" &&
          conditionResults.every(result => result === true);
        const negative =
          condition === "OR" &&
          conditionResults.some(result => result === true);

        const resultConnect = connects.filter(
          connect => connect.source === nodeSelected.id
        );

        if (positive) {
          next = resultConnect.filter(
            item => item.sourceHandle === "positive"
          )[0].target;
          noAlterNext = true;
        } else {
          next = resultConnect.filter(
            item => item.sourceHandle === "negative"
          )[0].target;
          noAlterNext = true;
        }

        isRandomizer = true;
      }

      if (nodeSelected.type === "request") {
        const { url, headerOptions, variables } = nodeSelected.data.request;
        const { method, body, headers } = headerOptions;
        try {
          const config = {
            method: method || "GET",
            url,
            headers: headers ? JSON.parse(headers) : {}, // Adiciona os cabeçalhos
            data: method !== "GET" && body ? JSON.parse(body) : undefined // Adiciona o corpo da requisição
          };

          const response = await axios(config);
          const responseData = response.data;

          if (variables && Array.isArray(variables)) {
            const updatedVariables = {
              ...(ticket?.dataWebhook?.variables || {})
            };

            variables.forEach(variable => {
              if (variable.field && variable.placeholder) {
                const value = getValueFromPath(
                  responseData,
                  variable.placeholder
                );
                updatedVariables[variable.field] = value;
              }
            });

            // Atualiza o ticket com as novas variáveis
            if (ticket) {
              await ticket.update({
                dataWebhook: {
                  ...ticket.dataWebhook,
                  variables: updatedVariables
                }
              });
            }
          }

          // Atualiza o ticket com o último node executado
          if (ticket) {
            await ticket.update({
              queueId: ticket.queueId ? ticket.queueId : null,
              userId: null,
              companyId: companyId,
              flowWebhook: true,
              lastFlowId: nodeSelected.id,
              hashFlowId: hashWebhookId,
              flowStopped: idFlowDb.toString()
            });
          }
        } catch (error) {
          console.log(error);
          /*
          logger.error(`Erro na requisição HTTP: ${error}`);
          throw new AppError(`Erro na requisição HTTP: ${error}`);
          */
        }

        /*
        
        try {
          const config = {
            method: method || 'GET',
            url,
            headers: headers ? JSON.parse(headers) : {},
            data: method !== 'GET' && body ? JSON.parse(body) : undefined
          };

          const response = await axios(config);
          const responseData = response.data;

          // Atualiza as variáveis com os dados da resposta
          if (variables && Array.isArray(variables)) {
            const updatedVariables = { ...(ticket?.dataWebhook?.variables || {}) };
            
            variables.forEach(variable => {
              if (variable.path && variable.name) {
                const value = getValueFromPath(responseData, variable.path);
                updatedVariables[variable.name] = value;
              }
            });

            // Atualiza o ticket com as novas variáveis
            if (ticket) {
              await ticket.update({
                dataWebhook: {
                  ...ticket.dataWebhook,
                  variables: updatedVariables
                }
              });
            }
          }

          // Atualiza o ticket com o último node executado
          if (ticket) {
            await ticket.update({
              queueId: ticket.queueId ? ticket.queueId : null,
              userId: null,
              companyId: companyId,
              flowWebhook: true,
              lastFlowId: nodeSelected.id,
              hashFlowId: hashWebhookId,
              flowStopped: idFlowDb.toString()
            });
          }

        } catch (error) {
          logger.error(`Erro na requisição HTTP: ${error}`);
          throw new AppError(`Erro na requisição HTTP: ${error}`);
        }
        */
      }

      if (nodeSelected.type === "singleBlock") {
        for (var iLoc = 0; iLoc < nodeSelected.data.seq.length; iLoc++) {
          const elementNowSelected = nodeSelected.data.seq[iLoc];

          ticket = await Ticket.findOne({
            where: { id: idTicket }
          });

          if (elementNowSelected.includes("message")) {
            const bodyFor = nodeSelected.data.elements.filter(
              item => item.number === elementNowSelected
            )[0].value;

            const ticketDetails = await ShowTicketService(idTicket, companyId);

            const variables = ticket?.dataWebhook?.variables || {};

            let msg = replaceMessages(variables, bodyFor);

            await delay(3000);

            await SendPresenceStatus(
              getWbot(whatsapp.id),
              `${ticketDetails.contact.number}@${
                ticket.isGroup ? "g.us" : "s.whatsapp.net"
              }`
            );

            await SendWhatsAppMessage({
              body: msg,
              ticket: ticketDetails,
              quotedMsg: null
            });

            SetTicketMessagesAsRead(ticketDetails);

            await ticketDetails.update({
              lastMessage: formatBody(bodyFor, ticket.contact)
            });

            await intervalWhats("1");
          }

          if (elementNowSelected.includes("img")) {
            await SendMessage(whatsapp, {
              number: numberClient,
              body: "",
              mediaPath:
                process.env.BACKEND_URL === "http://localhost:8090"
                  ? `${__dirname.split("src")[0].split("\\").join("/")}public/${
                      nodeSelected.data.elements.filter(
                        item => item.number === elementNowSelected
                      )[0].value
                    }`
                  : `${__dirname
                      .split("dist")[0]
                      .split("\\")
                      .join("/")}public/${
                      nodeSelected.data.elements.filter(
                        item => item.number === elementNowSelected
                      )[0].value
                    }`
            });
          }
          if (elementNowSelected.includes("audio")) {
            const mediaDirectory =
              process.env.BACKEND_URL === "http://localhost:8090"
                ? `${__dirname.split("src")[0].split("\\").join("/")}public/${
                    nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value
                  }`
                : `${__dirname.split("dist")[0].split("\\").join("/")}public/${
                    nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value
                  }`;
            const ticketInt = await Ticket.findOne({
              where: { id: idTicket ? idTicket : ticket.id }
            });
            await SendWhatsAppMediaFlow({
              media: mediaDirectory,
              ticket: ticketInt,
              isRecord: nodeSelected.data.elements.filter(
                item => item.number === elementNowSelected
              )[0].record
            });
            //fs.unlinkSync(mediaDirectory.split('.')[0] + 'A.mp3');
          }
          if (elementNowSelected.includes("video")) {
            const mediaDirectory =
              process.env.BACKEND_URL === "http://localhost:8090"
                ? `${__dirname.split("src")[0].split("\\").join("/")}public/${
                    nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value
                  }`
                : `${__dirname.split("dist")[0].split("\\").join("/")}public/${
                    nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value
                  }`;
            const ticketInt = await Ticket.findOne({
              where: { id: idTicket ? idTicket : ticket.id }
            });
            await SendWhatsAppMediaFlow({
              media: mediaDirectory,
              ticket: ticketInt
            });
            //fs.unlinkSync(mediaDirectory.split('.')[0] + 'A.mp3');
          }
        }
      }

      if (nodeSelected.type === "img") {
        await SendMessage(whatsapp, {
          number: numberClient,
          body: "",
          mediaPath:
            process.env.BACKEND_URL === "http://localhost:8090"
              ? `${__dirname.split("src")[0].split("\\").join("/")}public/${
                  nodeSelected.data.url
                }`
              : `${__dirname.split("dist")[0].split("\\").join("/")}public/${
                  nodeSelected.data.url
                }`
        });
      }
      if (nodeSelected.type === "audio") {
        const mediaDirectory =
          process.env.BACKEND_URL === "http://localhost:8090"
            ? `${__dirname.split("src")[0].split("\\").join("/")}public/${
                nodeSelected.data.url
              }`
            : `${__dirname.split("dist")[0].split("\\").join("/")}public/${
                nodeSelected.data.url
              }`;
        const ticketInt = await Ticket.findOne({
          where: { id: idTicket ? idTicket : ticket.id }
        });
        await SendWhatsAppMediaFlow({
          media: mediaDirectory,
          ticket: ticketInt,
          isRecord: nodeSelected.data.record
        });
        //fs.unlinkSync(mediaDirectory.split('.')[0] + 'A.mp3');
      }
      if (nodeSelected.type === "video") {
        const mediaDirectory =
          process.env.BACKEND_URL === "http://localhost:8090"
            ? `${__dirname.split("src")[0].split("\\").join("/")}public/${
                nodeSelected.data.url
              }`
            : `${__dirname.split("dist")[0].split("\\").join("/")}public/${
                nodeSelected.data.url
              }`;
        const ticketInt = await Ticket.findOne({
          where: { id: idTicket ? idTicket : ticket.id }
        });
        await SendWhatsAppMediaFlow({
          media: mediaDirectory,
          ticket: ticketInt
        });
        //fs.unlinkSync(mediaDirectory.split('.')[0] + 'A.mp3');
      }

      if (nodeSelected.type === "randomizer") {
        const selectedRandom = randomizarCaminho(
          nodeSelected.data.percent / 100
        );

        const resultConnect = connects.filter(
          connect => connect.source === nodeSelected.id
        );
        if (selectedRandom === "A") {
          next = resultConnect.filter(item => item.sourceHandle === "a")[0]
            .target;
          noAlterNext = true;
        } else {
          next = resultConnect.filter(item => item.sourceHandle === "b")[0]
            .target;
          noAlterNext = true;
        }
        isRandomizer = true;
      }
      let isMenu: boolean;

      if (nodeSelected.type === "menu") {
        if (pressKey) {
          const filterOne = connectStatic.filter(
            confil => confil.source === next
          );
          const filterTwo = filterOne.filter(
            filt2 => filt2.sourceHandle === "a" + pressKey
          );
          if (filterTwo.length > 0) {
            execFn = filterTwo[0].target;
          } else {
            execFn = undefined;
          }
          // execFn =
          //   connectStatic
          //     .filter(confil => confil.source === next)
          //     .filter(filt2 => filt2.sourceHandle === "a" + pressKey)[0]?.target ??
          //   undefined;
          if (execFn === undefined) {
            break;
          }
          pressKey = "999";

          const isNodeExist = nodes.filter(item => item.id === execFn);

          console.log(464, "ActionsWebhookService", isNodeExist);
          if (isNodeExist.length > 0) {
            isMenu = isNodeExist[0].type === "menu" ? true : false;
            isQuestion = isNodeExist[0].type === "question" ? true : false;
          } else {
            isMenu = false;
          }
        } else {
          let optionsMenu = "";
          nodeSelected.data.arrayOption.map(item => {
            optionsMenu += `[${item.number}] ${item.value}\n`;
          });

          const menuCreate = `${nodeSelected.data.message}\n\n${optionsMenu}`;

          let msg;

          msg = {
            body: menuCreate,
            number: numberClient,
            companyId: companyId
          };

          const ticketDetails = await ShowTicketService(ticket.id, companyId);

          //await CreateMessageService({ messageData: messageData, companyId });

          //await SendWhatsAppMessage({ body: bodyFor, ticket: ticketDetails, quotedMsg: null })

          // await SendMessage(whatsapp, {
          //   number: numberClient,
          //   body: msg.body
          // });

          await SendWhatsAppMessage({
            body: msg.body,
            ticket: ticketDetails,
            quotedMsg: null
          });

          SetTicketMessagesAsRead(ticketDetails);

          await ticketDetails.update({
            lastMessage: formatBody(msg.body, ticket.contact)
          });

          if (ticket) {
            ticket = await Ticket.findOne({
              where: {
                id: ticket.id
              }
            });
          } else {
            ticket = await Ticket.findOne({
              where: {
                id: idTicket
              }
            });
          }

          if (ticket) {
            await ticket.update({
              queueId: ticket.queueId ? ticket.queueId : null,
              userId: null,
              companyId: companyId,
              flowWebhook: true,
              lastFlowId: nodeSelected.id,
              dataWebhook: dataWebhook,
              hashFlowId: hashWebhookId,
              flowStopped: idFlowDb.toString()
            });
          }

          break;
        }
      }

      let isContinue = false;

      if (pressKey === "999" && execCount > 0) {
        pressKey = undefined;
        let result = connects.filter(connect => connect.source === execFn)[0];
        if (typeof result === "undefined") {
          next = "";
        } else {
          if (!noAlterNext) {
            next = result.target;
          }
        }
      } else {
        let result;
        if (isMenu) {
          result = { target: execFn };
          isContinue = true;
          pressKey = undefined;
        } else if (isQuestion) {
          console.log(804);
          result = { target: execFn };
          isContinue = true;
          pressKey = undefined;
        } else if (isRandomizer) {
          isRandomizer = false;
          result = next;
        } else {
          result = connects.filter(connect => connect.source === next)[0];
        }

        if (typeof result === "undefined") {
          next = "";
        } else {
          if (!noAlterNext) {
            next = result.target;
          }
        }
      }

      if (!pressKey && !isContinue) {
        const nextNode = connects.filter(
          connect => connect.source === nodeSelected.id
        ).length;

        if (nextNode === 0) {
          ticket = await Ticket.findOne({
            where: {
              id: idTicket
            },
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "name", "profile"]
              }
            ]
          });

          await ticket.update({
            lastFlowId: null,
            dataWebhook: null,
            hashFlowId: null,
            flowWebhook: false,
            flowStopped: idFlowDb.toString()
          });

          break;
        }
      }

      isContinue = false;

      if (next === "") {
        break;
      }

      ticket = await Ticket.findByPk(idTicket, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "profile"]
          }
        ]
      });

      console.log("UPDATE12...");
      await ticket.update({
        queueId: ticket?.queueId,
        userId: null,
        companyId: companyId,
        flowWebhook: true,
        lastFlowId: nodeSelected.id,
        hashFlowId: hashWebhookId,
        flowStopped: idFlowDb.toString()
      });

      noAlterNext = false;
      execCount++;

      if (nodeSelected.type === "closeTicket") {
        try {
          if (ticket) {
            ticket = await Ticket.findOne({
              where: {
                id: ticket.id
              },
              include: [
                { model: Contact, as: "contact", attributes: ["id", "name"] }
              ]
            });
          } else {
            ticket = await Ticket.findOne({
              where: {
                id: idTicket
              },
              include: [
                { model: Contact, as: "contact", attributes: ["id", "name"] }
              ]
            });
          }

          const ticketDetails = await ShowTicketService(idTicket, companyId);

          await SendPresenceStatus(
            getWbot(whatsapp.id),
            `${ticketDetails.contact.number}@${
              ticket.isGroup ? "g.us" : "s.whatsapp.net"
            }`
          );

          const closeMessage =
            "Atendimento encerrado. Obrigado por nos contatar!";

          await SendWhatsAppMessage({
            body: closeMessage,
            ticket: ticketDetails,
            quotedMsg: null
          });

          SetTicketMessagesAsRead(ticketDetails);

          await ticket.update({
            status: "closed",
            lastMessage: closeMessage,
            queueId: null,
            userId: null,
            flowWebhook: false,
            lastFlowId: null,
            hashFlowId: null,
            flowStopped: idFlowDb.toString()
          });

          io.to(ticket.status)
            .to("notification")
            .to(ticketDetails.id.toString())
            .emit(`company-${companyId}-ticket`, {
              action: "update",
              ticket: ticketDetails
            });

          break;
        } catch (error) {
          console.error("Error closing ticket:", error);
        }
      }
    }

    return "ds";
  } catch (error) {
    logger.error(error);
  }
};

/**
 * Avalia se uma condição é verdadeira ou falsa com base em tags do ticket.
 *
 * @param {Tag[] | string} tagList - Lista de tags ou uma única string.
 * @param {string} conditionType - Tipo da condição ("igual" ou outro).
 * @param {string | number} matchValue - Valor a ser comparado.
 * @returns {boolean} - Retorna `true` ou `false` com base na avaliação.
 */
const evaluateCondition = (tagList, conditionType, matchValue) => {
  if (!Array.isArray(tagList)) {
    return conditionType === "igual"
      ? tagList.toString() === matchValue
      : tagList.toString() !== matchValue;
  }

  return conditionType === "igual"
    ? tagList.some(tag => tag.name === matchValue)
    : tagList.every(tag => tag.name !== matchValue);
};

function between(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const constructJsonLine = (line: string, json: any) => {
  let valor = json;
  const chaves = line.split(".");

  if (chaves.length === 1) {
    return valor[chaves[0]];
  }

  for (const chave of chaves) {
    valor = valor[chave];
  }
  return valor;
};

function removerNaoLetrasNumeros(texto: string) {
  // Substitui todos os caracteres que não são letras ou números por vazio
  return texto.replace(/[^a-zA-Z0-9]/g, "");
}

const intervalWhats = (time: string) => {
  const seconds = parseInt(time) * 1000;
  return new Promise(resolve => setTimeout(resolve, seconds));
};

const replaceMessages = (variables, message) => {
  return message.replace(
    /{{\s*([^{}\s]+)\s*}}/g,
    (match, key) => variables[key] || ""
  );
};

const getValueFromPath = (obj: any, path: string) => {
  try {
    return path.split(".").reduce((acc, part) => acc[part], obj);
  } catch {
    return undefined;
  }
};

const switchFlow = async (
  whatsappId,
  msg,
  data,
  companyId,
  ticket,
  contact
) => {
  flowBuilderQueue(whatsappId, data, ticket, msg, companyId, contact);
};
