import 'dotenv/config'

// Helper function to get consistent cookie options based on environment
export const getCookieOptions = () => {
    // In development/HTTP, secure must be false. In production/HTTPS, secure should be true
    const isProduction = process.env.NODE_ENV === 'production';
    const secure = isProduction;
    // sameSite: "none" requires secure: true. Use "lax" for HTTP/development
    const sameSite = secure ? "none" : "lax";
    // Domain should be undefined for localhost/development, or set for production
    const domain = isProduction ? (process.env.DOMAIN ?? undefined) : undefined;
    
    return {
        httpOnly: true,
        secure: secure,
        sameSite: sameSite,
        domain: domain,
        path: "/",
    };
};


export const sendToken = async (res, name, value, age) => {
    res.cookie(name, value, {
        ...getCookieOptions(),
        maxAge: age,
    })
}

export const clearToken = async (res, accessTokenName, refreshTokenName) => {
    const baseOptions = {
        ...getCookieOptions(),
        expires: new Date(0),
    }

    res.cookie(accessTokenName, "", baseOptions)
    res.cookie(refreshTokenName, "", baseOptions)
}
