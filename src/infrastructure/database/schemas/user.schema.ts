import { User } from "@domain/entities/user.entity";

export interface UserDocument {
  _id: string;
  phoneNumber: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserSchema {
  static toDocument(user: User): UserDocument {
    return {
      _id: user.id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static toEntity(doc: UserDocument): User {
    return User.fromPersistence(
      doc._id,
      doc.phoneNumber,
      doc.createdAt,
      doc.updatedAt,
      doc.name
    );
  }
}
