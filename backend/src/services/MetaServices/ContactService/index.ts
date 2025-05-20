import Contact from "../../../models/Contact";
import CreateContactService from "../../ContactServices/CreateContactService";

export const verifyContact = async (msgContact: any, session: any, companyId: any) => {
    if (!msgContact) return null;
    let contact = await Contact.findOne({
      where: {
        number: msgContact.phoneNumber,
        companyId: companyId
      }
    });
  
    if (!contact) {
      contact = await CreateContactService({
        name: `${msgContact.name}`,
        number: msgContact.phoneNumber,
        email: msgContact.email,
        companyId: companyId,
      });
    }
  
    return contact;
  };
  