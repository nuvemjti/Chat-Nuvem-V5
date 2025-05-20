import GetTicketWbot from "../../../../../helpers/GetTicketWbot";
import Ticket from "../../../../../models/Ticket";


export const formatContactPreview = (vCard) => {
    const numberContact = vCard.number;
    const firstName = vCard.name.split(' ')[0];
    const lastName = String(vCard.name).replace(vCard.name.split(' ')[0], '')
  
    const vcard = `BEGIN:VCARD\n`
    + `VERSION:3.0\n`
    + `N:${lastName};${firstName};;;\n`
    + `FN:${vCard.name}\n`
    + `TEL;type=CELL;waid=${numberContact}:+${numberContact}\n`
    + `END:VCARD`;
  
    return vcard;
  
  }
  

export const sendActionWabaContact = async ({
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
    const whatsapp = await GetTicketWbot(ticket);
    

    /*
      const sendMessage = await sendWabaMedia(
        ticket.contact.number,
        whatsapp.officialAccessToken,
        whatsapp.officialPhoneNumberId,
        data,
        Types[wabaMediaType],
        body
      );
      */
  }