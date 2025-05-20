import { Request, Response } from "express";
import Whatsapp from "../models/Whatsapp";
import { handleWabaMessage } from "../services/MetaServices/WabaService/WabaMessageListener";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const whatsApp = await Whatsapp.findOne({
    where: {
      token: id
    }
  });

  if (!whatsApp) {
    return res.status(404).json({
      message: "Received"
    });
  }

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === whatsApp.token) {
      return res.status(200).send(challenge);
    }
  }
};

export const webHook = async (req: Request, res: Response) => {
  const { body } = req;

  if (body.object === "whatsapp_business_account") {
    console.log(JSON.stringify(body, null, 2));

    body.entry?.forEach(async (entry: any) => {
      if (entry?.statuses) return;

      const getTokenPage = await Whatsapp.findOne({
        where: {
          officialWppBusinessId: entry.id,
          channel: "official"
        }
      });

      if (getTokenPage && entry.changes[0].value?.messages) {
        handleWabaMessage(getTokenPage, entry, getTokenPage.companyId);
      }
    });

    return res.status(200).json({
      message: "EVENT_RECEIVED"
    });
  }

  return res.status(404).json({
    message: body
  });
};

/*
export const webhook = async (req: Request, res: Response) => {
  const { body } = req;

  const webhookBody: WebHookRequest = body;
  let channel: string = "oficial";

  console.log(webhookBody)
  
  if (webhookBody.entry.length > 0) {
    const changes = webhookBody.entry[0].changes;
    const changeValue = changes[0].value;
    const statuses = changeValue.statuses;

    const getTokenPage = await Whatsapp.findOne({
      where: {
        officialWppBusinessId: webhookBody.entry[0].id,
        channel
      }
    });

    if (changes.length > 0) {
      if (changes[0].field === "messages") {
        if (getTokenPage) {
          handleWabaMessage(
            getTokenPage,
            webhookBody.entry[0],
            getTokenPage.companyId
          );
        }

        if (statuses && statuses.length > 0) {
          for (const status of statuses) {
            let functionName:
              | "update_message_delivered_status"
              | "update_message_read_status"
              | "update_message_sent_status"
              | "update_message_failed_status"
              | null = null;
            if (status.status === "sent") {
              functionName = "update_message_delivered_status";
            } else if (status.status === "delivered") {
              functionName = "update_message_read_status";
            } else if (status.status === "read") {
              functionName = "update_message_read_status";
            } else if (status.status === "failed") {
              functionName = "update_message_failed_status";
            } else {
              console.log("Status not found");
            }

            if (functionName) {
              console.log(functionName)
            }
          }
        }
      }
    }
    return res.status(200).json({
      message: "EVENT_RECEIVED"
    });
  }

  return res.status(404).json({
    message: body
  });
};
*/
