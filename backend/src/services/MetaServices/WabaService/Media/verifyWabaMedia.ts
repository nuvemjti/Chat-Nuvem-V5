import { WAMessage } from "@whiskeysockets/baileys";
import Ticket from "../../../../models/Ticket";
import formatBody from "../../../../helpers/Mustache"
import { verifyQuotedMessage } from "../../../FacebookServices/facebookMessageListener";
import { getBodyMessage } from "../../../WbotServices/wbotMessageListener";
import CreateMessageService from "../../../MessageServices/CreateMessageService";

export const verifyWabaMediaMesssage = async ({
  msg,
  media,
  ticket,
  body,
  typeMessage,
}: {
  msg: WAMessage;
  media: Express.Multer.File;
  ticket: Ticket;
  body: string;
  typeMessage: string;
}) => {
 
  const quotedMsg = await verifyQuotedMessage(msg);

  const insertMsg = {
    wid: msg.key.id,
    ticketId: ticket.id,
    contactId: undefined,
    body: body ? formatBody(body, ticket) : formatBody(msg.message[typeMessage], ticket),
    fromMe: msg.key.fromMe,
    read: msg.key.fromMe,
    mediaUrl: media.filename,
    mediaType: typeMessage,
    quotedMsgId: quotedMsg?.id,
    ack: 5,
    remoteJid: msg.key.remoteJid,
    participant: msg.key.participant,
    dataJson: JSON.stringify(msg)
  };

  await ticket.update({
    lastMessage: media.filename
  });

  await CreateMessageService({
    messageData: insertMsg,
    companyId: ticket.companyId
  });
};