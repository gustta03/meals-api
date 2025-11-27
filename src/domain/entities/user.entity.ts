export class User {
  private constructor(
    public readonly id: string,
    public readonly phoneNumber: string,
    public readonly name?: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  static create(id: string, phoneNumber: string, name?: string): User {
    const now = new Date();
    return new User(id, phoneNumber, name, now, now);
  }

  static fromPersistence(
    id: string,
    phoneNumber: string,
    createdAt: Date,
    updatedAt: Date,
    name?: string
  ): User {
    return new User(id, phoneNumber, name, createdAt, updatedAt);
  }

  updateName(name: string): User {
    return new User(this.id, this.phoneNumber, name, this.createdAt, new Date());
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("User ID is required");
    }

    if (!this.phoneNumber || this.phoneNumber.trim().length === 0) {
      throw new Error("Phone number is required");
    }
  }
}
