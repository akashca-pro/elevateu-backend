import jwt from 'jsonwebtoken'
import 'dotenv/config'

export const generateAccessToken = (ID)=>{
    return jwt.sign({id : ID},process.env.JWT_SECRET,{
        expiresIn : '1d',
    });
};

export const generateRefreshToken = (ID)=>{
    return jwt.sign({id : ID},process.env.JWT_REFRESH,{
        expiresIn : '7d'
    });
}

