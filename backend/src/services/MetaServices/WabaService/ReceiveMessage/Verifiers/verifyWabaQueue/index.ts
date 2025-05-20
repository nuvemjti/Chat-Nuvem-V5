import path, { join } from "path";
import { head, isNil } from "lodash";
import fs from "fs";
import { Op } from "sequelize";
import moment from "moment";
import { proto } from "@whiskeysockets/baileys";
import Whatsapp from "../../../../../../models/Whatsapp";
import Ticket from "../../../../../../models/Ticket";
import Contact from "../../../../../../models/Contact";
import Message from "../../../../../../models/Message";
import ShowWhatsAppService from "../../../../../WhatsappService/ShowWhatsAppService";
import TicketTraking from "../../../../../../models/TicketTraking";
import ShowQueueIntegrationService from "../../../../../QueueIntegrationServices/ShowQueueIntegrationService";
import formatBody from "../../../../../../helpers/Mustache";
import { getMessageOptions } from "../../../../../WbotServices/SendWhatsAppMedia";
import { debounce } from "../../../../../../helpers/Debounce";

export const verifyWabaQueue = async (
  wbot: Whatsapp,
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
  settings?: any,
  ticketTraking?: TicketTraking
) => {
  
    /*  
    if (typeBot === "text") {
      return botText();
    }
  
    if (typeBot === "list") {
      return botList();
    }
  
    if (typeBot === "button") {
      return botButton();
    }
  
    if (typeBot === "button" && queues.length > 3) {
      return botText();
    }
      */
};
