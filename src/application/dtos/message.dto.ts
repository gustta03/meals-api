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
}

