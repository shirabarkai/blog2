import { Schema, model, Document, ObjectId } from "mongoose";
import bcrypt from "bcryptjs";

interface IRefreshToken {
  token: string;
  expiresAt: Date;
}

export interface IUser extends Document<ObjectId> {
  username: string;
  email: string;
  password: string;
  refreshTokens: IRefreshToken[];
  createdAt: Date;
  updatedAt: Date;
  addRefreshToken(token: string, expiresIn: number): void;
  removeRefreshToken(tokenToRemove: string): void;
  comparePassword(candidatePassword: string): Promise<boolean>;
  cleanExpiredTokens(): void;
}

const userSchema: Schema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as any, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to add refresh token
userSchema.methods.addRefreshToken = function (
  token: string,
  expiresIn: number
): void {
  this.cleanExpiredTokens();
  this.refreshTokens.push({
    token,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  });
};

// Method to remove refresh token
userSchema.methods.removeRefreshToken = function (tokenToRemove: string): void {
  this.refreshTokens = this.refreshTokens.filter(
    ({ token }: { token: string }) => token !== tokenToRemove
  );
};

// Method to clean expired tokens
userSchema.methods.cleanExpiredTokens = function (): void {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter(
    (token: IRefreshToken) => token.expiresAt > now
  );
};

const User = model<IUser>("User", userSchema);

export default User;
