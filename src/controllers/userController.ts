import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/User";
import { generateAccessToken, generateRefreshToken } from "../middleware/auth";
import { AuthRequest, UserRegistrationData, UserLoginData } from "../types";

const userController = {
  // Register new user
  async register(
    req: Request<never, unknown, UserRegistrationData>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { username, email, password } = req.body;

      // Validate email format
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ message: "Invalid email format" });
        return;
      }

      // Validate password length
      if (password.length < 6) {
        res
          .status(400)
          .json({ message: "Password must be at least 6 characters" });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        res.status(400).json({
          message: "User with this email or username already exists",
        });
        return;
      }

      // Create new user
      const user = new User({ username, email, password }) as IUser;
      await user.save();

      // Generate tokens
      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());

      // Add refresh token to user
      user.addRefreshToken(refreshToken, 7 * 24 * 60 * 60); // 7 days
      await user.save();

      const userResponse = {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      };

      res.status(201).json({
        message: "User registered successfully",
        user: userResponse,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  },

  // Login user
  async login(
    req: Request<never, unknown, UserLoginData>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = (await User.findOne({ email })) as IUser;
      if (!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      // Clean expired tokens before adding new one
      user.cleanExpiredTokens();

      // Generate tokens
      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());

      // Add refresh token to user
      user.addRefreshToken(refreshToken, 7 * 24 * 60 * 60);
      await user.save();

      const userResponse = {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      };

      res.json({
        user: userResponse,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const user = req.user as IUser;
      user.removeRefreshToken(refreshToken);
      await user.save();
      res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      next(error);
    }
  },

  // Get all users
  async getAllUsers(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const users = await User.find({}, { password: 0, refreshTokens: 0 });
      res.json(users);
    } catch (error) {
      next(error);
    }
  },

  // Get user by ID
  async getUserById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await User.findById(req.params.id, {
        password: 0,
        refreshTokens: 0,
      });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  // Update user
  async updateUser(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { username, email } = req.body;

      // Only allow users to update their own profile
      if (req.params.id !== req.user?._id.toString()) {
        res.status(403).json({ message: "Not authorized to update this user" });
        return;
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { username, email },
        { new: true, select: "-password -refreshTokens" }
      );

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  // Delete user
  async deleteUser(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Only allow users to delete their own account
      if (req.params.id !== req.user?._id.toString()) {
        res.status(403).json({ message: "Not authorized to delete this user" });
        return;
      }

      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};

export default userController;
