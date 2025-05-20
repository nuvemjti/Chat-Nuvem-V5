import { WAMessage } from "@whiskeysockets/baileys";
import fs from "node:fs";
import FormData from "form-data";
import Ticket from "../../../../../models/Ticket";
import GetTicketWhatsapp from "../../../../../helpers/GetTicketWhatsapp";
import { sendWabaMedia } from "../../../API/graphAPi";
import { wabaFormatterBaileysType } from "../../../../../libs/utils";
import { verifyWabaMediaMesssage } from "../../Media/verifyWabaMedia";


export const sendActionWabaImage = async ({
  media,
  body,
  typeMessage,
  ticket,
}: {
  media: Express.Multer.File;
  body: string;
  typeMessage: string;
  ticket: Ticket;
}) => {

  
  const whatsapp = await GetTicketWhatsapp(ticket);
  const file = fs.createReadStream(media.path);

  const data = new FormData();
  data.append("messaging_product", "whatsapp");
  data.append("file", file, {
    contentType: media.mimetype
  });
  data.append("type", typeMessage);
  

  
  const sendMessage = await sendWabaMedia(
    ticket.contact.number,
    whatsapp.officialAccessToken,
    whatsapp.officialPhoneNumberId,
    data,
    typeMessage,
    body
    );
  
 
  const msg = {
    key: {
      fromMe: true,
      id: sendMessage.messages[0].id
    },
    message: {
      [typeMessage]: media.filename
    }
  };


  await verifyWabaMediaMesssage({
    msg,
    media,
    ticket,
    body,
    typeMessage
  });

};
