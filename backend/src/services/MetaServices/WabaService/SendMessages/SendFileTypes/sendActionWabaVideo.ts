import fs from "node:fs";

import { WAMessage } from "@whiskeysockets/baileys";
import FormData from "form-data";
import Ticket from "../../../../../models/Ticket";
import GetTicketWhatsapp from "../../../../../helpers/GetTicketWhatsapp";
import { sendWabaMedia } from "../../../API/graphAPi";
import { wabaFormatterBaileysType } from "../../../../../libs/utils";
import { verifyWabaMediaMesssage } from "../../Media/verifyWabaMedia";


export const sendActionWabaVideo = async ({
  media,
  body,
  typeMessage,
  ticket,
  wabaMediaType
}: {
  media: Express.Multer.File;
  body: string;
  typeMessage: string;
  ticket: Ticket;
  wabaMediaType: string;
}) => {
  /*
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
    type,
    body
  );


  const msg = {
    key: {
      fromMe: true,
      id: sendMessage.messages[0].id
    },
    message: {
      [type]: media.filename
    }
  };

  await verifyWabaMediaMesssage({
    msg,
    wabaMediaType,
    media,
    ticket,
    body,
    typeMessage
  });
  */
};
