import { Media } from "../@types/types";

export const isMedia = (obj: any): obj is Media => {
    return (
      obj &&
      typeof obj === "object" &&
      "type" in obj &&
      "id" in obj &&
      "mime_type" in obj &&
      ["image", "video", "audio"].includes(obj.type)
    );
  };

  export const wabaFormatterBaileysType = (
    type:
      | "audio"
      | "image"
      | "contacts"
      | "document"
      | "text"
      | "video"
      | "template"
  ) => {
    switch (type) {
      case "audio":
        return "audioMessage";
      case "image":
        return "imageMessage";
      case "contacts":
        return "contactMessage";
      case "document":
        return "documentMessage";
      case "text":
        return "conversation";
      case "video":
        return "videoMessage";
      case "template":
        return "templateMessage";
      default:
        return "unknownMessage";
    }
  };
  