import fs from "node:fs";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { exec } from "child_process";
import path from "path";
import FormData from "form-data";
import Ticket from "../../../../../models/Ticket";
import GetTicketWhatsapp from "../../../../../helpers/GetTicketWhatsapp";
import { sendWabaMedia } from "../../../API/graphAPi";
import { wabaFormatterBaileysType } from "../../../../../libs/utils";
import { verifyWabaMediaMesssage } from "../../Media/verifyWabaMedia";

ffmpeg.setFfmpegPath(ffmpegPath);

const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

const processAudio = async (
  audio: string,
  companyId: string
): Promise<string> => {
  const outputAudio = `${publicFolder}/company${companyId}/${new Date().getTime()}.mp3`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath} -i ${audio}  -vn -ar 44100 -ac 2 -b:a 192k ${outputAudio} -y`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);
        // fs.unlinkSync(audio);
        resolve(outputAudio);
      }
    );
  });
};


export const sendActionWabaAudio = async ({
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

  const convert = await processAudio(media.path, String(ticket.companyId));

  const file = fs.createReadStream(convert);

  const data = new FormData();
  data.append("messaging_product", "whatsapp");
  data.append("file", file, {
    contentType: media.mimetype
  });
  data.append("type", media.mimetype);

  const sendMessage = await sendWabaMedia(
    ticket.contact.number,
    whatsapp.officialAccessToken,
    whatsapp.officialPhoneNumberId,
    data,
    Types[wabaMediaType],
    body
  );


    const keyType: Types = wabaMediaType;
  
    const key = wabaFormatterBaileysType(
      Types[keyType] as
        | "audio"
        | "image"
        | "contacts"
        | "document"
        | "text"
        | "video"
        | "template"
    );
  
    const msg = {
      key: {
        fromMe: true,
        id: sendMessage.messages[0].id
      },
      message: {
        [key]: media.filename
      }
    };


  await verifyWabaMediaMesssage({
    msg,
    wabaMediaType,
    media,
    ticket,
    body,
    typeMessage,
  });
  */
};
