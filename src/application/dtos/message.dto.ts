export interface IncomingMessageDto {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  isGroup: boolean;
  groupId?: string;
}

export interface SendMessageDto {
  to: string;
  message: string;
  imageBuffer?: Buffer;
  imageMimeType?: string;
  interactiveMessage?: {
    header?: string;
    body: string;
    footer?: string;
    buttons: Array<{
      id: string;
      title: string;
    }>;
  };
}

