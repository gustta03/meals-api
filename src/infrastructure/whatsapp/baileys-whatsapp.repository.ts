import makeWASocket, {
  WASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadContentFromMessage,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import qrcode from "qrcode-terminal";
import { IWhatsAppRepository } from "@domain/repositories/whatsapp.repository";
import { Message } from "@domain/entities/message.entity";
import { logger } from "@shared/logger/logger";

export class BaileysWhatsAppRepository implements IWhatsAppRepository {
  private socket: WASocket | null = null;
  private messageCallbacks: Array<(message: Message) => Promise<void>> = [];
  private authFolder = "./auth_info_baileys";

  async start(): Promise<void> {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);

    this.socket = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      auth: state,
    });

    this.socket.ev.on("creds.update", saveCreds);
    this.socket.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        logger.info("QR Code gerado para conectar ao WhatsApp");
        console.log("\nQR Code para conectar ao WhatsApp:\n");
        qrcode.generate(qr, { small: true });
        console.log("\nEscaneie o QR Code acima com o WhatsApp\n");
      }

      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        if (shouldReconnect) {
          logger.warn("WhatsApp desconectado, tentando reconectar...");
          this.start();
        } else {
          logger.warn("WhatsApp desconectado permanentemente (logged out)");
        }
      } else if (connection === "open") {
        logger.info("WhatsApp conectado com sucesso");
      }
    });

    this.socket.ev.on("messages.upsert", async (m) => {
      const message = m.messages[0];

      if (!message.key.fromMe && message.message) {
        const from = message.key.remoteJid || "";
        const to = this.socket?.user?.id || "";
        const body =
          message.message?.conversation ||
          message.message?.extendedTextMessage?.text ||
          "";

        const isGroup = from.includes("@g.us");
        const groupId = isGroup ? from : undefined;

        const timestamp = message.messageTimestamp
          ? new Date(Number(message.messageTimestamp) * 1000)
          : new Date();

        let imageBase64: string | undefined;
        let imageMimeType: string | undefined;
        let hasImage = false;

        if (message.message.imageMessage) {
          hasImage = true;
          try {
            const stream = await downloadContentFromMessage(message.message.imageMessage, "image");
            const chunks: Uint8Array[] = [];
            
            for await (const chunk of stream) {
              chunks.push(chunk);
            }
            
            const imageBuffer = Buffer.concat(chunks);
            imageBase64 = imageBuffer.toString("base64");
            imageMimeType = message.message.imageMessage?.mimetype || "image/jpeg";
          } catch (error) {
            logger.error({ error }, "Failed to download image from WhatsApp");
          }
        }

        if (body || hasImage) {
          const domainMessage = Message.fromWhatsApp(
            message.key.id || "",
            from,
            to,
            body || "",
            timestamp,
            isGroup,
            groupId,
            hasImage,
            imageBase64,
            imageMimeType
          );

          for (const callback of this.messageCallbacks) {
            await callback(domainMessage);
          }
        }
      }
    });
  }

  async stop(): Promise<void> {
    if (this.socket) {
      this.socket.end(undefined);
      this.socket = null;
    }
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.socket) {
      throw new Error("WhatsApp not connected");
    }

    await this.socket.sendMessage(to, { text: message });
  }

  async sendMessageToGroup(groupId: string, message: string): Promise<void> {
    await this.sendMessage(groupId, message);
  }

  onMessage(callback: (message: Message) => Promise<void>): void {
    this.messageCallbacks.push(callback);
  }

  isConnected(): boolean {
    return this.socket !== null;
  }
}

