import { Message } from "../entities/message.entity";

export interface InteractiveButton {
  id: string;
  title: string;
}

export interface InteractiveMessageOptions {
  header?: string;
  body: string;
  footer?: string;
  buttons: InteractiveButton[];
}

export interface IWhatsAppRepository {
  sendMessage(to: string, message: string): Promise<void>;
  sendMessageToGroup(groupId: string, message: string): Promise<void>;
  sendImage(to: string, imageBuffer: Buffer, caption?: string, mimeType?: string): Promise<void>;
  sendInteractiveMessage(to: string, options: InteractiveMessageOptions): Promise<void>;
  onMessage(callback: (message: Message) => Promise<void>): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  isConnected(): boolean;
}

