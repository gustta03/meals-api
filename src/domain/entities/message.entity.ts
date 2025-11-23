export class Message {
  private constructor(
    public readonly id: string,
    public readonly from: string,
    public readonly to: string,
    public readonly body: string,
    public readonly timestamp: Date,
    public readonly isGroup: boolean,
    public readonly groupId?: string,
    public readonly hasImage: boolean = false,
    public readonly imageBase64?: string,
    public readonly imageMimeType?: string
  ) {}

  static create(
    id: string,
    from: string,
    to: string,
    body: string,
    isGroup: boolean = false,
    groupId?: string,
    hasImage: boolean = false,
    imageBase64?: string,
    imageMimeType?: string
  ): Message {
    return new Message(id, from, to, body, new Date(), isGroup, groupId, hasImage, imageBase64, imageMimeType);
  }

  static fromWhatsApp(
    id: string,
    from: string,
    to: string,
    body: string,
    timestamp: Date,
    isGroup: boolean,
    groupId?: string,
    hasImage: boolean = false,
    imageBase64?: string,
    imageMimeType?: string
  ): Message {
    return new Message(id, from, to, body, timestamp, isGroup, groupId, hasImage, imageBase64, imageMimeType);
  }
}

