import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import { randomizarCaminho } from "../../utils/randomizador";
import { MessageData } from "../MessageServices/CreateMessageService";
import { sendWabaTextMessage } from "../MetaServices/WabaService/SendMessages/sendWabaTextMessage";
import ShowTicketService from "../TicketServices/ShowTicketService";
import { IConnections, INodes } from "./DispatchWebHookService";
import formatBody from "../../helpers/Mustache"
import User from "../../models/User";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";

export const ActionsWabaWebhookService = async (
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
  ): Promise<string> => {
    let next = nextStage;
  
    let createFieldJsonName = "";
  
    const connectStatic = connects;
  
    if (numberPhrase === "") {
      const nameInput = details.inputs.find(item => item.keyValue === "nome");
  
      nameInput.data.split(",").map(dataN => {
        const lineToData = details.keysFull.find(item =>
          item.endsWith(`.${dataN}`)
        );
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
        const lineToDataNumber = details.keysFull.find(item =>
          item.endsWith(`.${dataN}`)
        );
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
        if (emailInput.data.split[0] !== "") {
          return;
        }
        const lineToDataEmail = details.keysFull.find(item =>
          item.endsWith(`.${dataN}`)
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
          nodeSelected = {
            type: "menu"
          };
        } else {
          nodeSelected = nodes.filter(node => node.id === execFn)[0];
        }
      } else {
        const otherNode = nodes.filter(node => node.id === next)[0];
        if (otherNode) {
          nodeSelected = otherNode;
        }
      }

      if (nodeSelected.type === "message") {
        let msg;
        if (dataWebhook === "") {
          msg = {
            body: nodeSelected.data.label,
            number: numberClient,
            companyId: companyId
          };
        } else {
          const dataLocal = {
            nome: createFieldJsonName,
            numero: numberClient,
            email: createFieldJsonEmail
          };
          msg = {
            body: replaceMessages(
              nodeSelected.data.label,
              details,
              dataWebhook,
              dataLocal
            ),
            number: numberClient,
            companyId: companyId
          };
        }
  
        /*
        await SendMessage(whatsapp, {
          number: numberClient,
          body: msg.body
        });
        */
        //TESTE BOTÃO
        //await SendMessageFlow(whatsapp, {
        //  number: numberClient,
        //  body: msg.body
        //} )
        await intervalWhats("1");
      }
  
      if (nodeSelected.type === "singleBlock") {
        for (var iLoc = 0; iLoc < nodeSelected.data.seq.length; iLoc++) {
          const elementNowSelected = nodeSelected.data.seq[iLoc];
          if (elementNowSelected.includes("message")) {
            // await SendMessageFlow(whatsapp, {
            //   number: numberClient,
            //   body: nodeSelected.data.elements.filter(
            //     item => item.number === elementNowSelected
            //   )[0].value
            // });
            const bodyFor = nodeSelected.data.elements.filter(
              item => item.number === elementNowSelected
            )[0].value;
  
            const ticketDetails = await ShowTicketService(ticket.id, companyId);
  
            let msg;
  
            if (dataWebhook === "") {
              msg = bodyFor;
            } else {
              const dataLocal = {
                nome: createFieldJsonName,
                numero: numberClient,
                email: createFieldJsonEmail
              };
              msg = replaceMessages(bodyFor, details, dataWebhook, dataLocal);
            }

            await sendWabaTextMessage({
                body: msg,
                ticket: ticketDetails,
                quotedMsg: null
            })
  
            /*
            await SendWhatsAppMessage({
              body: msg,
              ticket: ticketDetails,
              quotedMsg: null
            });
  
            SetTicketMessagesAsRead(ticketDetails);
  
            */

            await ticketDetails.update({
              lastMessage: formatBody(bodyFor, ticket.contact)
            });
            await intervalWhats("1");
          }
          if (elementNowSelected.includes("interval")) {
            await intervalWhats(
              nodeSelected.data.elements.filter(
                item => item.number === elementNowSelected
              )[0].value
            );
          }
          if (elementNowSelected.includes("img")) {
            /*
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
                  : `${__dirname.split("dist")[0].split("\\").join("/")}public/${
                      nodeSelected.data.elements.filter(
                        item => item.number === elementNowSelected
                      )[0].value
                    }`
            });
            */
            await intervalWhats("1");
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
            /*
            await SendWhatsAppMediaFlow({
              media: mediaDirectory,
              ticket: ticketInt,
              isRecord: nodeSelected.data.elements.filter(
                item => item.number === elementNowSelected
              )[0].record
            });
            */
            //fs.unlinkSync(mediaDirectory.split('.')[0] + 'A.mp3');
            await intervalWhats("1");
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
            /*
            await SendWhatsAppMediaFlow({
              media: mediaDirectory,
              ticket: ticketInt
            });
            */
            //fs.unlinkSync(mediaDirectory.split('.')[0] + 'A.mp3');
            await intervalWhats("1");
          }
        }
      }
  
      if (nodeSelected.type === "img") {
        /*
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
        */
        await intervalWhats("1");
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

        /*
        await SendWhatsAppMediaFlow({
          media: mediaDirectory,
          ticket: ticketInt,
          isRecord: nodeSelected.data.record
        });
        //fs.unlinkSync(mediaDirectory.split('.')[0] + 'A.mp3');
        await intervalWhats("1");
        */
      }
      if (nodeSelected.type === "interval") {
        await intervalWhats(nodeSelected.data.sec);
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
        /*
        await SendWhatsAppMediaFlow({
          media: mediaDirectory,
          ticket: ticketInt
        });
        */
        //fs.unlinkSync(mediaDirectory.split('.')[0] + 'A.mp3');
        await intervalWhats("1");
      }
      let isRandomizer: boolean;
      if (nodeSelected.type === "randomizer") {
        const selectedRandom = randomizarCaminho(nodeSelected.data.percent / 100);
  
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
  
          const filterOne = connectStatic.filter(confil => confil.source === next)
          const filterTwo = filterOne.filter(filt2 => filt2.sourceHandle === "a" + pressKey)
          if(filterTwo.length > 0){
            execFn = filterTwo[0].target
          } else {
            execFn = undefined
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
  
          if (isNodeExist.length > 0) {
            isMenu = isNodeExist[0].type === "menu" ? true : false;
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
          if (dataWebhook === "") {
            msg = {
              body: menuCreate,
              number: numberClient,
              companyId: companyId
            };
          } else {
            const dataLocal = {
              nome: createFieldJsonName,
              numero: numberClient,
              email: createFieldJsonEmail
            };
            msg = {
              body: replaceMessages(menuCreate, details, dataWebhook, dataLocal),
              number: numberClient,
              companyId: companyId
            };
          }
  
          const ticketDetails = await ShowTicketService(ticket.id, companyId);
  
          await sendWabaTextMessage({
            body: msg.body,
            ticket: ticketDetails,
            quotedMsg: null
          })
 
  
          //SetTicketMessagesAsRead(ticketDetails);
  
          await ticketDetails.update({
            lastMessage: formatBody(msg.body, ticket.contact)
          });
          await intervalWhats("1");
  
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
          const ticket = await Ticket.findOne({
            where: { id: idTicket }
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
    }
  
    return "ds";
  };
  
  const constructJsonLine = (line: string, json: any) => {
    let valor = json;
    const chaves = line.split(".");
  
    if (chaves.length === 1) {
      return chaves[0];
    }
  
    for (const chave of chaves) {
      valor = valor[chave]; // Navega pelo objeto usando as chaves
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
  

  
  const replaceMessages = (
    message: string,
    details: any,
    dataWebhook: any,
    dataNoWebhook?: any
  ) => {
    const matches = message.match(/\{([^}]+)\}/g);
    if (dataWebhook === null) {
      let newTxt = message.replace("{nome}", dataNoWebhook.nome);
      newTxt = newTxt.replace("{numero}", dataNoWebhook.numero);
      newTxt = newTxt.replace("{email}", dataNoWebhook.email);
      return newTxt;
    }
    if (matches) {
      const placeholders = matches.map(match => match.replace(/\{|\}/g, ""));
      let newText = message;
      placeholders.map(item => {
        const value = details["inputs"].find(
          itemLocal => itemLocal.keyValue === item
        );
        const lineToData = details["keysFull"].find(itemLocal =>
          itemLocal.endsWith(`.${value.data}`)
        );
        const createFieldJson = constructJsonLine(lineToData, dataWebhook);
        newText = newText.replace(`{${item}}`, createFieldJson);
      });
      return newText;
    } else {
      return message;
    }
  };