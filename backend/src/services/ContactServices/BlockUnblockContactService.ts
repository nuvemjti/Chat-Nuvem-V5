import AppError from "../../errors/AppError";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import Whatsapp from "../../models/Whatsapp";

interface Request {
    contactId: string;
    companyId: string | number;
    active: boolean;
}

function formatBRNumber(jid: string): string {
    const regexp = /^(\d{2})(\d{2})\d{1}(\d{8})$/;
    const match = regexp.exec(jid);

    if (match && match[1] === '55') {
        const ddd = Number.parseInt(match[2]);
        if (ddd < 31) {
            return match[0];
        } else {
            return match[1] + match[2] + match[3];
        }
    }
    return jid;
}

function createJid(number: string): string {
    if (number.includes('@g.us') || number.includes('@s.whatsapp.net')) {
        return formatBRNumber(number);
    }
    return number.includes('-')
        ? `${number}@g.us`
        : `${formatBRNumber(number)}@s.whatsapp.net`;
}

const GetDefaultWhatsApp = async (companyId: number): Promise<Whatsapp> => {
    const whatsapp = await Whatsapp.findOne({
        where: { companyId },
        order: [["id", "ASC"]]
    });

    if (!whatsapp) {
        throw new AppError("ERR_NO_WHATSAPP_FOUND", 404);
    }

    return whatsapp;
};

const BlockUnblockContactService = async ({
    contactId,
    companyId,
    active
}: Request): Promise<Contact> => {
    const contact = await Contact.findByPk(contactId);

    if (!contact) {
        throw new AppError("ERR_NO_CONTACT_FOUND", 404);
    }

    console.log("Iniciando processo de bloqueio/desbloqueio:");
    console.log("Active:", active);
    console.log("CompanyId:", companyId);
    console.log("Contact Number:", contact.number);

    try {
        const whatsappCompany = await GetDefaultWhatsApp(Number(companyId));
        console.log("WhatsApp encontrado:", whatsappCompany);

        const wbot = getWbot(whatsappCompany.id);
        const jid = createJid(contact.number);

        if (active) {
            console.log(`Tentando desbloquear o contato: ${jid}`);
            await wbot.updateBlockStatus(jid, "unblock");
            await contact.update({ active: true });
            console.log("Contato desbloqueado com sucesso.");
        } else {
            console.log(`Tentando bloquear o contato: ${jid}`);
            await wbot.updateBlockStatus(jid, "block");
            await contact.update({ active: false });
            console.log("Contato bloqueado com sucesso.");
        }
    } catch (error) {
        console.error("Erro durante o bloqueio/desbloqueio do contato:", error);
        if (active) {
            console.error("Não consegui desbloquear o contato.");
        } else {
            console.error("Não consegui bloquear o contato.");
        }
    }

    return contact;
};

export default BlockUnblockContactService;
