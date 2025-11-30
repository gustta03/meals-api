export interface WhapiMessage {
  id: string;
  from: string;
  to?: string;
  timestamp: number;
  body?: string;
  type: "text" | "image" | "video" | "audio" | "document" | "location" | "contact" | "sticker";
  media?: {
    mimetype?: string;
    data?: string;
    url?: string;
    caption?: string;
  };
  context?: {
    from?: string;
    id?: string;
  };
  group?: {
    id: string;
    name?: string;
  };
  from_name?: string;
  chat_id?: string;
  text?: {
    body?: string;
  };
}

export interface WhapiWebhookPayload {
  event: "messages" | "status" | "contacts" | "groups" | "presence" | "error";
  messages?: WhapiMessage[];
  message?: WhapiMessage;
  payload?: any;
}

export interface WhapiSendMessageRequest {
  to: string;
  body?: string;
  media?: {
    type: "image" | "video" | "audio" | "document";
    media: string;
    mimetype?: string;
    caption?: string;
  };
  preview_url?: boolean;
}

export interface WhapiSendMessageResponse {
  messages: Array<{
    id: string;
    status: string;
  }>;
}

export interface WhapiChannel {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "connecting";
}

export interface WhapiInteractiveButton {
  type: "quick_reply";
  title: string;
  id: string;
  copy_code?: string;
  phone_number?: string;
  url?: string;
  merchant_url?: string;
}

export interface WhapiInteractiveRequest {
  to: string;
  quoted?: string;
  edit?: string;
  header?: {
    text?: string;
  };
  body: {
    text: string;
  };
  footer?: {
    text?: string;
  };
  action: {
    buttons?: WhapiInteractiveButton[];
    list?: {
      sections: Array<{
        title?: string;
        rows: Array<{
          title: string;
          description?: string;
          id: string;
        }>;
      }>;
      label: string;
    };
    product?: {
      catalog_id: string;
      product_id: string;
    };
  };
  type: "button" | "list" | "product";
  media?: string;
  mime_type?: string;
  no_encode?: boolean;
  no_cache?: boolean;
  caption?: string;
  preview?: string;
  width?: number;
  height?: number;
}

export interface WhapiInteractiveResponse {
  sent: boolean;
  message: WhapiMessage;
}

