import { proto, WAMessage } from "@whiskeysockets/baileys";
import Ticket from "../../../../../../models/Ticket";
import Whatsapp from "../../../../../../models/Whatsapp";
import { getIO } from "../../../../../../libs/socket";
import Message from "../../../../../../models/Message";
import { downloadMedia } from "./downloadMedia";
import { typeAttachment } from "../../../Media/typeAttachement";
import { verifyWabaMediaMesssage } from "../../../Media/verifyWabaMedia";
import Queue from "../../../../../../models/Queue";
import User from "../../../../../../models/User";
import Contact from "../../../../../../models/Contact";

export const verifyWabaDownloadMedia = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  session: Whatsapp
): Promise<void> => {
  const io = getIO();

  const metaLinkIdParam =
    msg.message?.audioMessage || msg.message?.imageMessage || msg.message?.documentMessage || msg.message.videoMessage


    const media = await downloadMedia({
      ticket,
      officialAccessToken: session.officialAccessToken,
      id: metaLinkIdParam
    });

    const typeMessage = media.mime_type.split("/")[0];

    const options = {
      fieldname: media.filename, // Nome do campo no formulário
      originalname: media.filename, // Nome original do arquivo
      mimetype: media.mime_type, // MIME type
      size: media.file_size, // Tamanho em bytes
      filename: media.filename, // Nome do arquivo salvo
      path: media.filePath
    } as Express.Multer.File

    const wabaMediaType = typeAttachment(options);

    await verifyWabaMediaMesssage({
      msg,
      media: options,
      ticket,
      body: media.filename,
      typeMessage,
  
    })
    
  if (!msg.key.fromMe && ticket.status === "closed") {
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" }
      ]
    });

    io.emit(`company-${ticket.companyId}-ticket`, {
      action: "delete",
      ticket,
      ticketId: ticket.id
    });

    io.emit(`company-${ticket.companyId}-ticket`, {
      action: "update",
      ticket,
      ticketId: ticket.id
    });
  }
};
