import * as nodemailer from 'nodemailer';
import * as randomstring from 'randomstring';
import { Request, Response } from 'express';
import User from '../models/User';
import Whatsapp from "../models/Whatsapp";
import GetDefaultWhatsApp from '../helpers/GetDefaultWhatsApp';
import { SendMessage } from '../helpers/SendMessage';
import GetWhatsappWbot from '../helpers/GetWhatsappWbot';
import AppError from '../errors/AppError';

// Função para gerar o código aleatório
const generateRandomCode = () => {
  return randomstring.generate({
    length: 6,
    charset: 'numeric',
  });
};

export const sendCodeVerifycation = async (req: Request, res: Response) => {
  try {
    let { wpp } = req.body;

    if (!wpp) {
      return res.status(400).json({ error: "Número de WhatsApp não fornecido." });
    }

    // Normaliza o número para remover o "9" extra do DDD
    const normalizedWpp = wpp.replace(/\D/g, "").replace(/^(55)(\d{2})9(\d{8})$/, "$1$2$3");

    console.log("DEBUG: Número normalizado:", normalizedWpp);

    // Tenta buscar o usuário com o número normalizado
    let user = await searchUserFromNumber(normalizedWpp);

    // Se não encontrar, tenta buscar o usuário com o número original (com "9")
    if (!user) {
      console.log("DEBUG: Usuário não encontrado com o número normalizado. Tentando com o número original...");
      user = await searchUserFromNumber(wpp);
    }

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado com esse número de WhatsApp." });
    }

    const verificationCode = generateRandomCode();
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 5);

    await User.update(
      { verificationCode, verificationcodeExpiration: expirationTime },
      { where: { wpp: user.wpp } } // Atualiza no banco usando o número encontrado
    );

    console.log(`Código de verificação para o usuário ${user.wpp} foi atualizado: ${verificationCode}`);

    const message = `\u200e Seu código de verificação é: ${verificationCode}`;
    console.log(`DEBUG: Usuário encontrado -> ID: ${user.id}, WhatsApp salvo: ${user.wpp}, CompanyID: ${user.companyId}`);

    // Agora buscando o WhatsApp com isDefault = true
    const whatsapp = await Whatsapp.findOne({
      where: {
        companyId: user.companyId,
        isDefault: true, // Verifica se é o WhatsApp padrão
      },
    });

    if (!whatsapp) {
      return res.status(404).json({ error: "WhatsApp padrão não encontrado." });
    }

    const wbot = await GetWhatsappWbot(whatsapp);

    // Sempre envia a mensagem para o número SEM o "9"
    const destinationNumber = user.wpp.replace(/\D/g, "").replace(/^(55)(\d{2})9(\d{8})$/, "$1$2$3");
    console.log(`DEBUG: Enviando mensagem para: ${destinationNumber}`);

    await wbot.sendMessage(`${destinationNumber}@s.whatsapp.net`, { text: message });

    res.status(200).json({ message: "Código enviado com sucesso!", userId: user.id });
  } catch (error) {
    console.error("Erro ao enviar código de verificação:", error);
    res.status(500).json({ error: "Erro ao enviar código de verificação." });
  }
};




// Verificar o código fornecido pelo usuário
export const getVerificationData = async (req: Request, res: Response) => {
  const { code } = req.body; // Apenas o código fornecido pelo usuário

  try {
    if (!code) {
      return res.status(400).json({ error: 'Código é obrigatório.' });
    }

    // Primeiro, verifica o código no banco de dados
    const user = await User.findOne({
      where: { verificationCode: code }, // Verifica o código diretamente na coluna 'verificationCode'
    });

    if (!user) {
      return res.status(404).json({ error: 'Código inválido.' });
    }

    // Verifica se o userId pertence ao companyId correto (assumindo que o campo companyId está na tabela User)
    const currentCompanyId = user.companyId;
    if (!currentCompanyId) {
      return res.status(400).json({ error: 'UserId não está associado a uma empresa.' });
    }

    // Aqui você pode realizar a verificação de 'companyId' se necessário
    // Exemplo de como obter o companyId, caso precise verificar algo adicional

    // Verifica se o código não expirou
    const { verificationCode: dbVerificationCode, verificationcodeExpiration } = user;
    const currentTime = new Date();

    if (dbVerificationCode.trim() !== code.trim()) {
      return res.status(400).json({ error: 'Código inválido.' });
    }

    if (new Date(verificationcodeExpiration) < currentTime) {
      return res.status(400).json({ error: 'Código expirado.' });
    }

    // Tudo certo, o código é válido e pertence ao usuário correto
    return res.status(200).json({ message: 'Código válido, por favor, continue para redefinir a senha.' });
  } catch (error) {
    console.error('Erro ao verificar código de verificação:', error);
    res.status(500).json({ error: 'Erro ao verificar código de verificação.' });
  }
};


export const searchUserFromNumber = async (phoneNumber: string) => {
  try {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      console.error('Número inválido ou ausente.');
      return null;
    }

    const user = await User.findOne({
      where: { wpp: phoneNumber },
      attributes: ['id', 'wpp', 'companyId'] // Garantindo que companyId seja retornado
    });

    if (!user) {
      console.error(`Nenhum usuário encontrado com o número ${phoneNumber}.`);
      return null;
    }

    console.log(`Usuário encontrado:`, user.toJSON()); // <-- ADICIONE ISSO

    return user;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
};


// Atualizar senha do usuário
export const updatePassword = async (req: Request, res: Response) => {
  const { userId, newPassword } = req.body;

  try {
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'ID do usuário e nova senha são obrigatórios.' });
    }

    const userToUpdate = await User.findByPk(userId);

    if (userToUpdate) {
      userToUpdate.password = newPassword;
      await userToUpdate.save();

      res.status(200).json({ message: 'Senha atualizada com sucesso.' });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado.' });
    }
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro ao atualizar senha.' });
  }
};

// Buscar todos os usuários
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
};