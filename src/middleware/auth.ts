import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Load environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret-key";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

// Middleware to authenticate JWT token
const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ message: "Access token is required" });
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      const user = await User.findById(decoded.userId);

      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(403).json({ message: "Invalid token" });
    }
  } catch (error) {
    next(error);
  }
};

// Generate access token
const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

// Generate refresh token
const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

// Verify refresh token
const verifyRefreshToken = async (token: string): Promise<IUser> => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Clean expired tokens and check if refresh token exists
    user.cleanExpiredTokens();
    const tokenExists = user.refreshTokens.some((rt) => rt.token === token);

    if (!tokenExists) {
      throw new Error("Invalid refresh token");
    }

    await user.save();
    return user;
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

// Refresh token middleware
const refreshTokens = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }

    const user = await verifyRefreshToken(refreshToken);

    // Remove old refresh token
    user.removeRefreshToken(refreshToken);

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    // Add new refresh token
    user.addRefreshToken(newRefreshToken, REFRESH_TOKEN_EXPIRY_SECONDS);
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({ message: error.message });
      return;
    }
    next(error);
  }
};

export {
  authenticateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  refreshTokens,
  REFRESH_TOKEN_EXPIRY_SECONDS,
};
