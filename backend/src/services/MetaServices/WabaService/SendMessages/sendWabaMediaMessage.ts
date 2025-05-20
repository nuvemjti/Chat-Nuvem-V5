import { AnyMessageContent, WAMessage } from "@whiskeysockets/baileys";
import Ticket from "../../../../models/Ticket";
import { sendActionWabaImage } from "./SendFileTypes/sendActionWabaImage";
import { sendActionWabaVideo } from "./SendFileTypes/sendActionWabaVideo";
import { sendActionWabaAudio } from "./SendFileTypes/sendActionWabaAudio";
import AppError from "../../../../errors/AppError";
import { typeAttachment } from "../Media/typeAttachement";

export enum Types {
  "image",
  "audio",
  "document",
  "contacts",
  "video",
  "template",
  "application",
  "gif",
  "default"
}

interface Request {
  ticket: Ticket;
  media?: Express.Multer.File;
  body?: string;
  url?: string;
  isPrivate?: boolean;
  isForwarded?: boolean;
}

interface Paylod {
  media: Express.Multer.File;
  body: string;
  typeMessage: string;
  ticket: Ticket;}


const mediaActionsContainer = ({
  action,
  payload
}: {
  action: string;
  payload: Paylod;
}) => {
  const sendOptions = {
    image: sendActionWabaImage,
    video: sendActionWabaVideo,
    audio: sendActionWabaAudio
  };

  if (sendOptions[action]) {
    sendOptions[action](payload);
  }
};

export const SendWabaMediaMessage = async ({
  media,
  ticket,
  body
}: Request): Promise<any> => {
  try {
    const pathMedia = media.path;
    const typeMessage = media.mimetype.split("/")[0];
    let options: AnyMessageContent;

    console.log(577, "[log] sendWabaMediaMessage", typeMessage)

    mediaActionsContainer({
      action: typeMessage,
      payload: {
        media,
        body,
        ticket,
        typeMessage
      }
    });
  
  } catch (err) {
    console.trace(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};
