import fs from "fs";
import { writeFile } from "fs/promises";
import { writeFileSync } from "fs";
import path from "path";
import { get, RequestOptions } from "https";
import { join } from "path";

import { ReadableStream } from "stream/web";
import axios from "axios";
import { IncomingMessage } from "http";
import { getWabaMediaUrl } from "../../../../API/graphAPi";

type WWCustoResponse = IncomingMessage & {
  body: ReadableStream<Uint16Array> | null;
};

interface Response {
  filename: string;
  filePath: string;
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
  messaging_product: string;
}

const publicFolder = process.env.BACKEND_PUBLIC_PATH;

function httpsGet(
  url: string | URL,
  options: RequestOptions
): Promise<WWCustoResponse> {
  return new Promise((resolve, reject) => {
    get(url, options, res => {
      const newRes = res as WWCustoResponse;
      newRes.body = new ReadableStream({
        start(controller) {
          res.on("data", chunk => {
            controller.enqueue(chunk);
          });
          res.on("end", () => {
            controller.close();
          });
        }
      });
      resolve(newRes);
    }).on("error", e => {
      reject(e);
    });
  });
}

const fileRegex = /filename=.+\.(\w+)$/;
const getFileExtensionFromContentDisposition = (contentDisposition: string) => {
  const regexResult = fileRegex.exec(contentDisposition);
  if (regexResult) {
    return regexResult[1];
  }
  console.log(`${contentDisposition} could not be parsed`);
  return null;
};

async function saveReadableStreamToFile(
  stream: ReadableStream<Uint16Array>,
  filePath
) {
  const chunks = [];

  // Consumir o stream de forma assíncrona
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  // Converte os chunks para um buffer único
  const buffer = Buffer.concat(chunks);

  // Escreve o buffer no arquivo
  await writeFile(filePath, buffer);
}

export const downloadMedia = async ({
  ticket,
  officialAccessToken,
  id
}): Promise<Response> => {
  try {
    const media = await getWabaMediaUrl(officialAccessToken, id);

    const headerOptions = {
      Authorization: `Bearer ${officialAccessToken}`,
      "User-Agent": "curl/7.84.0",
      Accept: "*/*"
    };

    const mediaReponse = await httpsGet(media.url, {
      headers: headerOptions
    });

    const mediaBody = mediaReponse.body;

    if (!mediaBody) {
      throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
    }

    const contentDispositio = mediaReponse.headers["content-disposition"];
    let extension;

    if (contentDispositio) {
      extension = getFileExtensionFromContentDisposition(contentDispositio);
    }
    if (!extension) {
      extension = "unknown";
    }

    const filename = `${new Date().getTime()}.${extension}`;

    const folder = path.resolve(publicFolder, `company${ticket.companyId}`);

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
      fs.chmodSync(folder, 0o777);
    }

    const filePath = path.join(folder, filename);

    await saveReadableStreamToFile(mediaBody, filePath);

    return {
      filePath,
      filename,
      ...media
    };
  } catch (err) {
    console.error(err);
  }
};
