import { Op } from "sequelize";
import * as Yup from "yup";

import AppError from "../../errors/AppError";
import ShowUserService from "./ShowUserService";
import Company from "../../models/Company";
import User from "../../models/User";

interface UserData {
  email?: string;
  password?: string;
  name?: string;
  profile?: string;
  companyId?: number;
  queueIds?: number[];
  startWork?: string;
  endWork?: string;
  farewellMessage?: string;
  whatsappId?: number;
  allTicket?: string;
  defaultTheme?: string;
  defaultMenu?: string;
  allowGroup?: boolean;
  allHistoric?: string;
  allUserChat?: string;
  userClosePendingTicket?: string;
  showDashboard?: string;
  defaultTicketsManagerWidth?: number;
  allowRealTime?: string;
  allowContacts?: string;
  allowKanban?: string;
  allowCampaigns?: string;
  allowConnections?: string;
  profileImage?: string;
  wpp?: string;
}

interface Request {
  userData: UserData;
  userId: string | number;
  companyId: number;
  requestUserId: number;
}

interface Response {
  id: number;
  name: string;
  email: string;
  profile: string;
}

const UpdateUserService = async ({
  userData,
  userId,
  companyId,
  requestUserId
}: Request): Promise<Response | undefined> => {
  const user = await ShowUserService(userId, companyId);

  const requestUser = await User.findByPk(requestUserId);

  if (requestUser.super === false && userData.companyId !== companyId) {
    throw new AppError("O usuário não pertence à esta empresa");
  }

  // Verificação de duplicação de número de WhatsApp
  if (userData.wpp) {
    const existingWpp = await User.findOne({
      where: { wpp: userData.wpp, id: { [Op.ne]: user.id } } // Verifica se o número já está em uso, excluindo o usuário atual
    });

    if (existingWpp) {
      throw new AppError("Número de WhatsApp já cadastrado.");
    }
  }

  const schema = Yup.object().shape({
    name: Yup.string().min(2),
    allHistoric: Yup.string(),
    email: Yup.string().email(),
    profile: Yup.string(),
    password: Yup.string()
  });

  const oldUserEmail = user.email;

  const {
    email,
    password,
    profile,
    name,
    queueIds = [],
    startWork,
    endWork,
    farewellMessage,
    whatsappId,
    allTicket,
    defaultTheme,
    defaultMenu,
    allowGroup,
    allHistoric,
    allUserChat,
    userClosePendingTicket,
    showDashboard,
    defaultTicketsManagerWidth = 550,
    allowRealTime,
    allowContacts,
    allowKanban,
    allowCampaigns,
    allowConnections,
    profileImage,
    wpp
  } = userData;

  try {
    await schema.validate({ email, password, profile, name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  await user.update({
    email,
    password,
    profile,
    name,
    startWork,
    endWork,
    farewellMessage,
    whatsappId: whatsappId || null,
    allTicket,
    defaultTheme,
    defaultMenu,
    allowGroup,
    allHistoric,
    allUserChat,
    userClosePendingTicket,
    showDashboard,
    defaultTicketsManagerWidth,
    allowRealTime,
    allowContacts,
    allowKanban,
    allowCampaigns,
    allowConnections,
    profileImage,
    wpp
  });

  await user.$set("queues", queueIds);

  await user.reload();

  const company = await Company.findByPk(user.companyId);

  if (company.email === oldUserEmail) {
    await company.update({
      email,
      password
    });
  }

  const serializedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile,
    companyId: user.companyId,
    company,
    queues: user.queues,
    startWork: user.startWork,
    endWork: user.endWork,
    greetingMessage: user.farewellMessage,
    allTicket: user.allTicket,
    defaultMenu: user.defaultMenu,
    defaultTheme: user.defaultTheme,
    allowGroup: user.allowGroup,
    allHistoric: user.allHistoric,
    userClosePendingTicket: user.userClosePendingTicket,
    showDashboard: user.showDashboard,
    defaultTicketsManagerWidth: user.defaultTicketsManagerWidth,
    allowRealTime: user.allowRealTime,
    allowContacts: user.allowContacts,
    allowKanban: user.allowKanban,
    allowCampaigns: user.allowCampaigns,
    allowConnections: user.allowConnections,
    profileImage: user.profileImage,
    wpp: user.wpp
  };

  return serializedUser;
};

export default UpdateUserService;
