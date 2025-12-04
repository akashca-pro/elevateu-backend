import passport from "passport";
import {Strategy as GoogleStrategy} from 'passport-google-oauth20'
import 'dotenv/config'
import User from "../model/user.js";
import Tutor from "../model/tutor.js";
import {generateAccessToken} from '../utils/generateToken.js'

passport.use(
    "google-user",
    new GoogleStrategy(
        {
            clientID : process.env.GOOGLE_CLIENT_ID,
            clientSecret : process.env.GOOGLE_CLIENT_SECRET,
            callbackURL : process.env.CALLBACK_URL_USER,
            passReqToCallback : true
        },
        async (req,accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({googleID : profile.id})

                if(!user){
                    user = await User.create({
                        googleID : profile.id,
                        firstName: profile.name.givenName,
                        email: profile.emails[0].value,
                        isVerified :true,
                        isActive : true
                    });
                }

                const token = generateAccessToken(user._id);
                
                return done(null,{user,token})

            } catch (error) {
                return done(error,null)
            }
        }
    )
);

passport.use(
    "google-tutor",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL_TUTOR,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {

          let tutor = await Tutor.findOne({ googleID: profile.id });
  
          if (!tutor) {
            tutor = await Tutor.create({
              googleID: profile.id,
              firstName: profile.name.givenName,
              email: profile.emails[0].value,
              isVerified :true,
              isActive : true
            });
          }
  
        
          const token = generateAccessToken(tutor._id);
          
          return done(null, {tutor,token});
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
  
  export default passport