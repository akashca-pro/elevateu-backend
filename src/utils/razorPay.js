import 'dotenv/config'
import Razorpay from "razorpay";
import crypto from 'crypto'

const razorpay = new Razorpay({
    key_id : process.env.RAZORPAY_KEY_ID,
    key_secret : process.env.RAZORPAY_SECRET_KEY
})

export const razorpayOrder = async(finalPrice) => {
    
    try {
        const razorpayOrder = await razorpay.orders.create({
            amount : finalPrice * 100,
            currency : 'INR',
            receipt : `order_${Date.now()}`,
            payment_capture : 1
        })

        return razorpayOrder
        
    } catch (error) {
        console.log('error creating order id');
        throw new Error(error.message)
    }

}

export const generateSignature = (razorpay_order_id, razorpay_payment_id) => {
    return crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY) 
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
}