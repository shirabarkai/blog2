import { Schema, model, Document, ObjectId } from "mongoose";
import { IUser } from "./User";
import { IPost } from "./Post";

export interface IComment extends Document<ObjectId> {
  content: string;
  post: IPost["_id"];
  author: IUser["_id"];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Comment = model<IComment>("Comment", commentSchema);

export default Comment;
