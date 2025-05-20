export const typeAttachment = (media: Express.Multer.File): string => {
  const mimetype = media.mimetype.split("/")[0]
    switch (mimetype) {
      case "image":
        return mimetype;
      case "video":
        return mimetype;
      case "audio":
        return mimetype;
      case "application":
        return mimetype;
      case "gif":
        return  mimetype;
      default:
        return mimetype;
    }
  };