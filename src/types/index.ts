import { Request } from "express";
import { IUser } from "../models/User";

// Generic type for Request params, response body, and request body
export interface AuthRequest extends Request {
  user?: IUser;
}

export interface UserRegistrationData {
  username: string;
  email: string;
  password: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface RefreshTokenData {
  token: string;
  expiresAt: Date;
}
