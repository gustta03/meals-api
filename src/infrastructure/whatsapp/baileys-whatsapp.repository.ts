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
  private isConnecting = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionUpdateHandler: ((update: any) => void) | null = null;
  private messagesUpsertHandler: ((m: any) => Promise<void>) | null = null;

  async start(): Promise<void> {
    if (this.isConnecting) {
      logger.debug("Connection already in progress, skipping");
      return;
    }

    if (this.socket && this.socket.user) {
      logger.debug("Already connected, skipping start");
      return;
    }

    this.isConnecting = true;

    try {
      if (this.socket) {
        try {
          if (this.connectionUpdateHandler) {
            try {
              this.socket.ev.removeAllListeners("connection.update");
            } catch (error) {
              logger.debug({ error }, "Error removing connection.update listeners");
            }
            this.connectionUpdateHandler = null;
          }
          if (this.messagesUpsertHandler) {
            try {
              this.socket.ev.removeAllListeners("messages.upsert");
            } catch (error) {
              logger.debug({ error }, "Error removing messages.upsert listeners");
            }
            this.messagesUpsertHandler = null;
          }
          this.socket.end(undefined);
        } catch (error) {
          logger.debug({ error }, "Error closing previous socket");
        }
        this.socket = null;
      }

      const { version } = await fetchLatestBaileysVersion();
      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);

      this.socket = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
      });

      this.socket.ev.on("creds.update", saveCreds);
      
      this.connectionUpdateHandler = (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        logger.debug({ connection, hasLastDisconnect: !!lastDisconnect, hasQr: !!qr }, "Connection update received");

        if (qr) {
          logger.info({ qrCode: qr }, "QR Code gerado para conectar ao WhatsApp");
          console.log("\nQR Code para conectar ao WhatsApp:\n");
          qrcode.generate(qr, { small: true });
          console.log("\nEscaneie o QR Code acima com o WhatsApp\n");
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          logger.warn(
            {
              statusCode,
              shouldReconnect,
              error: lastDisconnect?.error?.message,
            },
            "WhatsApp desconectado"
          );

          if (shouldReconnect) {
            logger.warn("Tentando reconectar em 3 segundos...");
            this.isConnecting = false;
            
            if (this.reconnectTimeout !== null) {
              clearTimeout(this.reconnectTimeout);
              this.reconnectTimeout = null;
            }
            
            this.reconnectTimeout = setTimeout(() => {
              this.start().catch((error) => {
                logger.error({ error }, "Error during reconnection");
                this.isConnecting = false;
              });
            }, 3000);
          } else {
            logger.warn("WhatsApp desconectado permanentemente (logged out)");
            this.isConnecting = false;
          }
        } else if (connection === "open") {
          this.isConnecting = false;
          
          if (this.reconnectTimeout !== null) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
          }
          
          const phoneNumber = this.socket?.user?.id?.split(":")[0] || "N/A";
          logger.info(
            {
              phoneNumber,
              jid: this.socket?.user?.id,
            },
            "WhatsApp conectado com sucesso"
          );
          console.log(`\n✅ WhatsApp conectado! Número: ${phoneNumber}\n`);
          console.log("📱 Agora você pode enviar mensagens para este número para testar o bot.\n");
        } else if (connection === "connecting") {
          logger.debug("WhatsApp conectando...");
        }
      };

      this.socket.ev.on("connection.update", this.connectionUpdateHandler);

      this.messagesUpsertHandler = async (m: any) => {
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
      };

      this.socket.ev.on("messages.upsert", this.messagesUpsertHandler);
    } catch (error) {
      this.isConnecting = false;
      logger.error({ error }, "Error starting WhatsApp connection");
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.isConnecting = false;
    
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      try {
        this.socket.ev.removeAllListeners("connection.update");
        this.socket.ev.removeAllListeners("messages.upsert");
        this.socket.ev.removeAllListeners("creds.update");
      } catch (error) {
        logger.debug({ error }, "Error removing listeners");
      }
      
      this.connectionUpdateHandler = null;
      this.messagesUpsertHandler = null;
      
      this.socket.end(undefined);
      this.socket = null;
    }
  }

  async sendMessage(to: string, message: string): Promise<void> {
    logger.debug(
      {
        hasSocket: !!this.socket,
        socketUser: this.socket?.user?.id,
        isConnected: this.isConnected(),
      },
      "Estado do socket antes de enviar mensagem"
    );

    if (!this.socket) {
      logger.error("Tentativa de enviar mensagem sem conexão WhatsApp - socket é null");
      throw new Error("WhatsApp not connected");
    }

    if (!this.socket.user) {
      logger.error("Tentativa de enviar mensagem sem conexão WhatsApp - socket.user é undefined");
      throw new Error("WhatsApp not connected - user not authenticated");
    }

    try {
      logger.debug({ to, messageLength: message.length }, "Enviando mensagem via Baileys");
      await this.socket.sendMessage(to, { text: message });
      logger.info({ to }, "Mensagem enviada com sucesso via Baileys");
    } catch (error) {
      logger.error({ error, to }, "Erro ao enviar mensagem via Baileys");
      throw error;
    }
  }

  async sendMessageToGroup(groupId: string, message: string): Promise<void> {
    await this.sendMessage(groupId, message);
  }

  async sendImage(to: string, imageBuffer: Buffer, caption?: string, mimeType: string = "image/png"): Promise<void> {
    if (!this.socket) {
      logger.error("Tentativa de enviar imagem sem conexão WhatsApp");
      throw new Error("WhatsApp not connected");
    }

    try {
      logger.debug({ to, imageSize: imageBuffer.length, mimeType }, "Enviando imagem via Baileys");
      await this.socket.sendMessage(to, {
        image: imageBuffer,
        caption: caption || "",
        mimetype: mimeType,
      });
      logger.info({ to }, "Imagem enviada com sucesso via Baileys");
    } catch (error) {
      logger.error({ error, to }, "Erro ao enviar imagem via Baileys");
      throw error;
    }
  }

  async sendInteractiveMessage(to: string, options: import("@domain/repositories/whatsapp.repository").InteractiveMessageOptions): Promise<void> {
    logger.warn({ to }, "Interactive messages not supported in Baileys, sending as regular message");
    const messageText = options.header ? `${options.header}\n\n${options.body}` : options.body;
    const footerText = options.footer ? `\n\n${options.footer}` : "";
    await this.sendMessage(to, `${messageText}${footerText}`);
  }

  onMessage(callback: (message: Message) => Promise<void>): void {
    this.messageCallbacks.push(callback);
  }

  isConnected(): boolean {
    const connected = this.socket !== null && this.socket.user !== undefined;
    logger.debug(
      {
        hasSocket: !!this.socket,
        hasUser: !!this.socket?.user,
        userId: this.socket?.user?.id,
        connected,
      },
      "Verificando status de conexão"
    );
    return connected;
  }
}

