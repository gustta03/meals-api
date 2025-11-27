import { User } from "@domain/entities/user.entity";
import { IUserRepository } from "@domain/repositories/user.repository";
import { MongoDBConnection } from "../database/mongodb.connection";
import { Collection } from "mongodb";
import { DATABASE } from "@shared/constants/database.constants";
import { UserSchema, UserDocument } from "../database/schemas/user.schema";
import { logger } from "@shared/logger/logger";

export class MongoDBUserRepository implements IUserRepository {
  private get collection(): Collection<UserDocument> {
    const collection = MongoDBConnection.getInstance()
      .getDatabase()
      .collection<UserDocument>(DATABASE.COLLECTIONS.USERS);
    
    // Ensure unique index on phoneNumber
    collection.createIndex({ phoneNumber: 1 }, { unique: true }).catch(() => {
      // Index might already exist, ignore error
    });
    
    return collection;
  }

  async findById(id: string): Promise<User | null> {
    try {
      const doc = await this.collection.findOne({ _id: id });
      return doc ? UserSchema.toEntity(doc) : null;
    } catch (error) {
      logger.error({ error, userId: id }, "Failed to find user by id");
      throw new Error(`Failed to find user by id: ${error}`);
    }
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    try {
      const doc = await this.collection.findOne({ phoneNumber });
      return doc ? UserSchema.toEntity(doc) : null;
    } catch (error) {
      logger.error({ error, phoneNumber }, "Failed to find user by phone number");
      throw new Error(`Failed to find user by phone number: ${error}`);
    }
  }

  async save(user: User): Promise<User> {
    try {
      const doc = UserSchema.toDocument(user);
      await this.collection.insertOne(doc);
      return user;
    } catch (error: any) {
      if (error.code === 11000) {
        logger.warn({ phoneNumber: user.phoneNumber }, "User already exists with this phone number");
        throw new Error("User with this phone number already exists");
      }
      logger.error({ error, userId: user.id, phoneNumber: user.phoneNumber }, "Failed to save user");
      throw new Error(`Failed to save user: ${error}`);
    }
  }

  async update(user: User): Promise<User> {
    try {
      const doc = UserSchema.toDocument(user);
      const result = await this.collection.updateOne(
        { _id: user.id },
        { $set: doc }
      );
      if (result.matchedCount === 0) {
        throw new Error("User not found");
      }
      return user;
    } catch (error) {
      logger.error({ error, userId: user.id }, "Failed to update user");
      throw new Error(`Failed to update user: ${error}`);
    }
  }
}
