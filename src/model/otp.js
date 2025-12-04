import mongoose from "mongoose";
import { nanoid } from "nanoid";

const otpSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => nanoid(12),
    },
    email: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "tutor"],
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    otpType: {
      type: String,
      enum: ["signIn", "resetPassword", "updateEmail", "changePassword"],
      required: true,
    },
    otpExpires: {
        type: Date,
        required: true,
    },
  },
  { timestamps: true }
);

otpSchema.index({ otpExpires : 1 }, {expireAfterSeconds : 300})

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
