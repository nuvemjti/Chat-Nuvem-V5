import axios from "axios";
import FormData from "form-data";
import AppError from "../../../errors/AppError";


const apiBase = (officialAccessToken: string) =>
  axios.create({
    baseURL: "https://graph.facebook.com/v20.0",
    headers: {
      Authorization: `Bearer ${officialAccessToken}`,
      "Content-Type": "application/json"
    }
  });

export const getWabaMessageTemplate = async (
  officialAccessToken: string,
  officialWppBusinessId: string
) => {
  const { data } = await axios({
    url: `https://graph.facebook.com/v20.0/${officialWppBusinessId}/message_templates`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${officialAccessToken}`,
      "Content-Type": "application/json"
    }
  });

  return data?.data;
};

export const sendwabaText = async (
  number: string,
  body: string,
  accessToken: string,
  phoneNumberId: string,
  context?: { message_id: string }
) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: number,
        type: "text",
        text: {
          preview_url: true,
          body: body
        },
        context: context
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  } catch (err) {
    console.log(err);
    throw new AppError("ERR_SENDING_WHATSAPP_MSG");
  }
};

export const getWabaMediaUrl = async (
  officialAccessToken: string,
  id: string
): Promise<{
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
  messaging_product: string;
}> => {
  const { data } = await apiBase(officialAccessToken).get(id);

  return data;
};

const sendMediaFromId = async (
  to: string,
  officialAccessToken: string,
  officialWppBusinessId: string,
  id: string,
  type: string,
  caption: string,
  originalname?: string
): Promise<{
  messaging_product: string;
  contacts: [
    {
      input: string;
      wa_id: string;
    }
  ];
  messages: [
    {
      id: string;
      message_status: string;
    }
  ];
}> => {
  let payload = "";

  switch (type) {
    case "image":
      payload = JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type,
        image: {
          caption,
          id
        }
      });
      break;
    case "video":
      payload = JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type,
        video: {
          caption,
          id
        }
      });
      break;
    case "audio":
      payload = JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type,
        audio: {
          caption,
          id
        }
      });
      break;
    case "document":
      payload = JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type,
        document: {
          caption,
          id,
          filename: originalname
        }
      });
      break;
  }

  const { data } = await axios({
    url: `https://graph.facebook.com/v20.0/${officialWppBusinessId}/messages`,
    method: "post",
    headers: {
      Authorization: `Bearer ${officialAccessToken}`,
      "Content-Type": "application/json"
    },
    data: payload
  });

  return data;
};

export const sendWabaMedia = async (
  sendNumber: string,
  officialAccessToken: string,
  officialWppBusinessId: string,
  formData: FormData,
  type: string,
  caption: string,
  originalname?: string
): Promise<{
  messaging_product: string;
  contacts: [
    {
      input: string;
      wa_id: string;
    }
  ];
  messages: [
    {
      id: string;
      message_status: string;
    }
  ];
}> => {
  const { data } = await axios({
    url: `https://graph.facebook.com/v20.0/${officialWppBusinessId}/media`,
    method: "post",
    headers: {
      Authorization: `Bearer ${officialAccessToken}`
    },
    data: formData
  });

  const { id } = data;

  const payload = await sendMediaFromId(
    sendNumber,
    officialAccessToken,
    officialWppBusinessId,
    id,
    type,
    caption,
    originalname
  );

  return payload;
};