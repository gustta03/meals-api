import { CONFIG } from "@shared/constants/config.constants";
import { logger } from "@shared/logger/logger";
import { WhapiSendMessageRequest, WhapiSendMessageResponse, WhapiChannel, WhapiInteractiveRequest, WhapiInteractiveResponse } from "./types/whapi.types";
import { ERROR_MESSAGES } from "@shared/constants/error-messages.constants";

export class WhapiClient {
  private readonly apiUrl: string;
  private readonly apiToken: string;
  private readonly channelId: string;

  constructor(apiUrl?: string, apiToken?: string, channelId?: string) {
    this.apiUrl = apiUrl || CONFIG.WHAPI.API_URL;
    this.apiToken = apiToken || CONFIG.WHAPI.API_TOKEN || "";
    this.channelId = channelId || CONFIG.WHAPI.CHANNEL_ID || "";

    if (!this.apiToken) {
      logger.warn("WHAPI_API_TOKEN not configured");
    }
    if (!this.channelId) {
      logger.warn("WHAPI_CHANNEL_ID not configured");
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      "Authorization": `Bearer ${this.apiToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    
    try {
      logger.debug({ url, method: options.method || "GET" }, "Whapi API request");

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw await this._createApiError(response, url, options.method);
      }

      const data = await this._parseResponse<T>(response, url);
      logger.debug({ url, responseData: data }, "Whapi API response received");
      return data;
    } catch (error) {
      logger.error({ error, url }, "Whapi API request error");
      throw error;
    }
  }

  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");
    const withoutWhatsAppSuffix = cleaned.replace(/@s\.whatsapp\.net$/i, "");
    const withoutGroupSuffix = withoutWhatsAppSuffix.replace(/@g\.us$/i, "");
    return withoutGroupSuffix;
  }

  async sendMessage(request: WhapiSendMessageRequest): Promise<WhapiSendMessageResponse> {
    const formattedTo = this.formatPhoneNumber(request.to);
    const payload = this._buildMessagePayload(request, formattedTo);

    const endpoint = payload.media
      ? `/messages/image?channel_id=${this.channelId}`
      : `/messages/text?channel_id=${this.channelId}`;

    const bodyLength = typeof payload.body === "string" ? payload.body.length : 0;
    const mediaType = payload.media ? (payload.media as { type?: string }).type : undefined;
    
    logger.debug({ 
      endpoint, 
      to: formattedTo, 
      hasBody: !!payload.body,
      hasMedia: !!payload.media,
      bodyLength,
      mediaType,
      payloadKeys: Object.keys(payload),
    }, "Sending message via Whapi");

    return this.request<WhapiSendMessageResponse>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async sendTextMessage(to: string, message: string): Promise<void> {
    try {
      const formattedTo = this.formatPhoneNumber(to);
      logger.debug({ original: to, formatted: formattedTo }, "Formatting phone number");
      
      const response: any = await this.sendMessage({
        to: formattedTo,
        body: message,
      });
      
      const messageId = this._extractMessageId(response);
      logger.info({ to: formattedTo, messageId }, "Message sent via Whapi");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMessage, to }, "Failed to send text message via Whapi");
      throw error;
    }
  }

  async sendImage(
    to: string,
    imageBuffer: Buffer,
    caption?: string,
    mimeType: string = "image/png"
  ): Promise<void> {
    try {
      const base64Image = imageBuffer.toString("base64");
      const dataUri = `data:${mimeType};base64,${base64Image}`;
      const captionText = caption || "";

      logger.debug({
        to,
        imageSize: imageBuffer.length,
        captionLength: captionText.length,
        mimeType,
      }, "Preparing to send image via Whapi");

      // Conforme documentação do Whapi, para imagens usamos:
      // - endpoint: /messages/image
      // - payload: { to, caption, media } onde media pode ser URL ou data URI
      const response = await this.sendMessage({
        to,
        body: captionText,
        media: {
          type: "image",
          media: dataUri, // Data URI com base64
          mimetype: mimeType,
          caption: captionText,
        },
      });

      const messageId = this._extractMessageId(response);
      logger.info({ 
        to, 
        messageId, 
        hasCaption: !!captionText,
        imageSize: imageBuffer.length,
      }, "Image sent successfully via Whapi");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ 
        error: errorMessage, 
        to,
        imageSize: imageBuffer.length,
        hasCaption: !!caption,
      }, "Failed to send image via Whapi");
      throw error;
    }
  }

  async sendInteractiveMessage(request: WhapiInteractiveRequest): Promise<WhapiInteractiveResponse> {
    try {
      const formattedTo = this.formatPhoneNumber(request.to);
      const endpoint = `/messages/interactive?channel_id=${this.channelId}`;

      logger.debug({
        endpoint,
        to: formattedTo,
        type: request.type,
        buttonCount: request.action.buttons?.length || 0,
        hasHeader: !!request.header,
        hasFooter: !!request.footer,
      }, "Sending interactive message via Whapi");

      const payload = {
        ...request,
        to: formattedTo,
      };

      const response = await this.request<WhapiInteractiveResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const messageId = this._extractMessageId(response.message || response);
      logger.info({ 
        to: formattedTo, 
        messageId,
        type: request.type,
        sent: response.sent,
      }, "Interactive message sent successfully via Whapi");

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ 
        error: errorMessage, 
        to: request.to,
        type: request.type,
      }, "Failed to send interactive message via Whapi");
      throw error;
    }
  }

  async getChannelStatus(): Promise<WhapiChannel | null> {
    if (!this.channelId) {
      logger.warn("WHAPI_CHANNEL_ID not configured, cannot check channel status");
      return null;
    }

    const healthStatus = await this._getChannelStatusFromHealth();
    if (healthStatus) {
      return healthStatus;
    }

    return await this._getChannelStatusFromChannels();
  }

  isConfigured(): boolean {
    return !!(this.apiToken && this.channelId);
  }

  private async _createApiError(
    response: Response,
    url: string,
    method?: string
  ): Promise<Error> {
    const errorText = await this._readErrorResponse(response);
    const errorDetails = this._parseErrorDetails(errorText);
    
    logger.error(
      {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url,
        method: method || "GET",
      },
      "Whapi API request failed"
    );
    
    return new Error(
      `Whapi API error: ${response.status} ${response.statusText} - ${errorDetails.substring(0, 200)}`
    );
  }

  private async _readErrorResponse(response: Response): Promise<string> {
    try {
      return await response.text();
    } catch {
      return "Failed to read error response";
    }
  }

  private _parseErrorDetails(errorText: string): string {
    try {
      const errorJson = JSON.parse(errorText);
      return JSON.stringify(errorJson, null, 2);
    } catch {
      return errorText;
    }
  }

  private async _parseResponse<T>(response: Response, url: string): Promise<T> {
    try {
      const responseText = await response.text();
      if (!responseText) {
        return {} as T;
      }
      return JSON.parse(responseText) as T;
    } catch (parseError) {
      logger.warn({ parseError, url }, "Failed to parse response as JSON, treating as empty");
      return {} as T;
    }
  }

  private _buildMessagePayload(
    request: WhapiSendMessageRequest,
    formattedTo: string
  ): Record<string, unknown> {
    const caption = request.media?.caption || request.body || "";
    
    if (request.media) {
      return {
        to: formattedTo,
        caption: caption,
        media: request.media.media,
      };
    }
    
    const payload: Record<string, unknown> = {
      to: formattedTo,
      body: request.body || "",
    };
    
    if (request.preview_url !== undefined) {
      payload.preview_url = request.preview_url;
    }

    return payload;
  }

  private _extractMessageId(response: unknown): string {
    const responseAny = response as Record<string, unknown>;
    return (
      (responseAny?.messages as Array<{ id?: string }>)?.[0]?.id ||
      (responseAny?.message as { id?: string })?.id ||
      (responseAny?.id as string) ||
      "unknown"
    );
  }

  private async _getChannelStatusFromHealth(): Promise<WhapiChannel | null> {
    try {
      const healthEndpoint = `/health?channel_id=${this.channelId}`;
      const healthResponse = await this.request<{ status?: string; name?: string }>(healthEndpoint, {
        method: "GET",
      });
      
      if (!healthResponse?.status) {
        return null;
      }

      return {
        id: this.channelId,
        name: healthResponse.name || "Unknown",
        status: healthResponse.status === "connected" ? "connected" : "disconnected",
      };
    } catch (healthError) {
      logger.debug({ error: healthError }, "Health endpoint failed, trying channels endpoint");
      return null;
    }
  }

  private async _getChannelStatusFromChannels(): Promise<WhapiChannel | null> {
    try {
      const endpoint = `/channels/${this.channelId}`;
      return await this.request<WhapiChannel>(endpoint, {
        method: "GET",
      });
    } catch (error) {
      logger.debug({ error }, "Failed to get channel status from Whapi (this is not critical)");
      return null;
    }
  }
}

