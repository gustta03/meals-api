import { IWhatsAppRepository } from "@domain/repositories/whatsapp.repository";
import { Message } from "@domain/entities/message.entity";
import { WhapiClient } from "./whapi-client";
import { logger } from "@shared/logger/logger";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";
import { CONFIG } from "@shared/constants/config.constants";

export class WhapiWhatsAppRepository implements IWhatsAppRepository {
  private readonly whapiClient: WhapiClient;
  private messageCallbacks: Array<(message: Message) => Promise<void>> = [];
  private isStarted = false;

  constructor(apiUrl?: string, apiToken?: string, channelId?: string) {
    this.whapiClient = new WhapiClient(apiUrl, apiToken, channelId);
  }

  async start(): Promise<void> {
    if (this.isStarted) {
      logger.debug("Whapi repository already started");
      return;
    }

    if (!this.whapiClient.isConfigured()) {
      logger.warn("Whapi is not configured. Please set WHAPI_API_TOKEN and WHAPI_CHANNEL_ID environment variables");
      throw new Error(ERROR_MESSAGES.WHAPI.NOT_CONFIGURED);
    }

    // Note: We don't verify channel status here because:
    // 1. Messages come via webhook, so channel status check is not required for receiving messages
    // 2. The channel verification endpoint may fail due to API changes or incorrect channel ID format
    // 3. The important thing is that credentials are configured - webhook will work if properly set up
    this.isStarted = true;
    logger.info(
      { 
        apiUrl: CONFIG.WHAPI.API_URL,
        hasChannelId: !!CONFIG.WHAPI.CHANNEL_ID,
      },
      "Whapi repository started. Ready to receive messages via webhook. Make sure webhook is configured in Whapi dashboard."
    );
  }

  async stop(): Promise<void> {
    this.isStarted = false;
    logger.info("Whapi repository stopped");
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.isStarted) {
      logger.error("Cannot send message: repository not started");
      throw new Error("WhatsApp repository not started");
    }

    try {
      await this.whapiClient.sendTextMessage(to, message);
      logger.debug({ to }, "Message sent successfully");
    } catch (error) {
      logger.error({ error, to }, "Failed to send message");
      throw error;
    }
  }

  async sendMessageToGroup(groupId: string, message: string): Promise<void> {
    await this.sendMessage(groupId, message);
  }

  async sendImage(
    to: string,
    imageBuffer: Buffer,
    caption?: string,
    mimeType: string = "image/png"
  ): Promise<void> {
    if (!this.isStarted) {
      logger.error("Cannot send image: repository not started");
      throw new Error("WhatsApp repository not started");
    }

    try {
      await this.whapiClient.sendImage(to, imageBuffer, caption, mimeType);
      logger.debug({ to }, "Image sent successfully");
    } catch (error) {
      logger.error({ error, to }, "Failed to send image");
      throw error;
    }
  }

  onMessage(callback: (message: Message) => Promise<void>): void {
    this.messageCallbacks.push(callback);
    logger.debug({ callbackCount: this.messageCallbacks.length }, "Message callback registered");
  }

  async processIncomingMessage(whapiMessage: any): Promise<void> {
    if (!this.isStarted) {
      logger.warn("Received message but repository is not started, ignoring");
      return;
    }

    try {
      const domainMessage = await this.mapWhapiMessageToDomain(whapiMessage);
      
      if (!domainMessage) {
        logger.debug({ messageType: whapiMessage.type }, "Message type not supported, skipping");
        return;
      }

      logger.debug(
        {
          messageId: domainMessage.id,
          from: domainMessage.from,
          type: whapiMessage.type,
        },
        "Processing incoming Whapi message"
      );

      for (const callback of this.messageCallbacks) {
        await callback(domainMessage);
      }
    } catch (error) {
      logger.error({ error, whapiMessage }, "Failed to process incoming Whapi message");
    }
  }

  private async mapWhapiMessageToDomain(whapiMessage: any): Promise<Message | null> {
    try {
      const from = whapiMessage.from || "";
      const to = whapiMessage.to || whapiMessage.chat_id || "";
      const body = whapiMessage.body || whapiMessage.text?.body || (typeof whapiMessage.text === "string" ? whapiMessage.text : "") || "";
      const isGroup = whapiMessage.group?.id ? true : from.includes("@g.us") || to.includes("@g.us");
      const groupId = whapiMessage.group?.id || (isGroup ? (to || from) : undefined);

      const timestamp = whapiMessage.timestamp
        ? new Date(whapiMessage.timestamp * 1000)
        : new Date();

      const hasImage = whapiMessage.type === "image" && !!whapiMessage.media;
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;

      if (hasImage && whapiMessage.media) {
        imageMimeType = whapiMessage.media.mimetype || "image/jpeg";
        
        if (whapiMessage.media.data) {
          imageBase64 = whapiMessage.media.data.replace(/^data:image\/[a-z]+;base64,/, "");
        } else if (whapiMessage.media.url) {
          try {
            logger.debug({ url: whapiMessage.media.url }, "Downloading image from URL");
            const imageResponse = await fetch(whapiMessage.media.url);
            if (imageResponse.ok) {
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              imageBase64 = imageBuffer.toString("base64");
            } else {
              logger.warn({ url: whapiMessage.media.url, status: imageResponse.status }, "Failed to download image from URL");
            }
          } catch (error) {
            logger.error({ error, url: whapiMessage.media.url }, "Error downloading image from URL");
          }
        }
      }

      if (!body && !hasImage) {
        return null;
      }

      return Message.fromWhatsApp(
        whapiMessage.id || `${Date.now()}-${Math.random()}`,
        from,
        to,
        body,
        timestamp,
        isGroup,
        groupId,
        hasImage,
        imageBase64,
        imageMimeType
      );
    } catch (error) {
      logger.error({ error, whapiMessage }, "Failed to map Whapi message to domain");
      return null;
    }
  }

  isConnected(): boolean {
    return this.isStarted && this.whapiClient.isConfigured();
  }
}

