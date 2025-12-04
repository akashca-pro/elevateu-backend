import User from "../model/user.js";
import Tutor from "../model/tutor.js";
import { randomInt } from 'node:crypto';
import OTP from "../model/otp.js";
import { sendEmailOTP } from "./sendEmail.js";

export const generateOtpCode = () => {

  const otp = randomInt(100000, 999999).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000;

  return {otp , otpExpires}
}

export const sendOtpViaEmail = async (role, email, otpType, firstName) => {
  
    try {
      
      const {otp} = generateOtpCode();

      await OTP.create({
          email,
          role,
          otp,
          otpType,
          otpExpires : new Date(Date.now() + 5 * 60 * 1000)
      });

      await sendEmailOTP(email, firstName, otp)

      return true

    } catch (error) {
      console.log(error)
      throw new Error('Error sending otp')
    }

}

export const saveOtp = async (role,email,otp,otpExpires) => {

      const db = role === 'user' ? User : Tutor;

      const record = await db.findOneAndUpdate(
        { email },
        { otp, otpExpires },
        { new: true } 
      );

      if (!record) {
        throw new Error('User not found');
      }

    return true
}