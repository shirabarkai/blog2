import { Schema, model, Document, ObjectId } from "mongoose";
import { IUser } from "./User";

export interface IPost extends Document<ObjectId> {
  title: string;
  content: string;
  author: IUser["_id"];
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for comments
// postSchema.virtual("comments", {
//   ref: "Comment",
//   localField: "_id",
//   foreignField: "post",
// });

const Post = model<IPost>("Post", postSchema);

export default Post;
