import Tutor from "../../model/tutor.js";
import Wallet from "../../model/wallet.js";
import WithdrawalRequest from "../../model/withdrawRequest.js";
import { saveNotification, sendNotification } from "../../utils/LiveNotification.js";
import ResponseHandler from "../../utils/responseHandler.js";
import HttpStatus from "../../utils/statusCodes.js";
import { STRING_CONSTANTS } from "../../utils/stringConstants.js";
import 'dotenv/config'


export const loadExistingBankDetails = async (req,res) => {
    
    try {
        const tutorId = req.tutor.id;
        const tutor = await Tutor.findById(tutorId)

        if(!tutor)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        if(!tutor?.bankDetails){
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NO_CONTENT);
        }

        const bankDetails = {
            accountNumber : tutor.bankDetails.accountNumber,
            ifsc : tutor.bankDetails.ifsc,
            bankName : tutor.bankDetails.bankName,
            holderName : tutor.bankDetails.holderName
        }

        return ResponseHandler.success(res, STRING_CONSTANTS.LOADING_BANK_DETAILS_SUCCESS, HttpStatus.OK, bankDetails)

    } catch (error) {
        console.log(STRING_CONSTANTS.SERVER,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

export const addBankAccountDetails = async (req,res) => {
    
    try {
        const tutorId = req.tutor.id;
        const { formData } = req.body;

        if(!formData)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.BAD_REQUEST);

        const bankDetails = {
            accountNumber : formData.accountNumber,
            ifsc : formData.ifsc,
            bankName : formData.bankName,
            holderName : formData.holderName
        }
        await Tutor.findByIdAndUpdate(
            tutorId,
            { bankDetails },
            { new: true, upsert: false } 
          )

        return ResponseHandler.success(res, STRING_CONSTANTS.ADDING_BANK_DETAILS_SUCCESS, HttpStatus.OK,formData)

    } catch (error) {
        console.log(STRING_CONSTANTS.SERVER,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

export const intiateWithdrawalRequest = async (req,res) => {
    
    try {
        const tutorId = req.tutor.id;
        const { formData } = req.body;
        const alreadyRequested = await WithdrawalRequest.findOne({ userId : tutorId, userModel : 'Tutor' })
        
        if(alreadyRequested && alreadyRequested.status === 'pending')
            return ResponseHandler.error(res, STRING_CONSTANTS.EXIST,HttpStatus.CONFLICT);

        const wallet = await Wallet.findOne({ userId : tutorId, userModel : 'Tutor' });

        if(formData.amount > wallet.balance){
            return ResponseHandler.error(res, STRING_CONSTANTS.INSUFFICIENT_FUNDS, HttpStatus.BAD_REQUEST);
        }

        const tutor = await Tutor.findById(tutorId).select('email firstName bankDetails')

        await WithdrawalRequest.create({
            userId : tutorId,
            userName : tutor.firstName,
            userModel : 'Tutor',
            amount : formData.amount,
            email : tutor.email,
            bankDetails : formData.method === 'bank' ? tutor.bankDetails : undefined,
            paymentMethod : formData.method,
            status : 'pending',
        })

        const newNotification = await saveNotification(process.env.ADMIN_ID, 'Admin', 'withdraw_request', `Withdraw request recieved from ${tutor.firstName} email : ${tutor?.email}`)

        sendNotification(req, newNotification)


        return ResponseHandler.success(res, STRING_CONSTANTS.REQUEST_WITHDRAWAL_SUCCESS, HttpStatus.OK);

    } catch (error) {
        console.log(STRING_CONSTANTS.SERVER, error.message);
        
        // Handle Mongoose validation errors and return them to client
        if (error.name === 'ValidationError' || error.message.includes('required')) {
            return ResponseHandler.error(res, error.message, HttpStatus.BAD_REQUEST);
        }
        
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

export const loadWithdrawalRequest = async (req,res) => {
    
    try {
        const tutorId = req.tutor.id;

        const withdrawRequest = await WithdrawalRequest.findOne({ userId : tutorId, userModel : 'Tutor' , status : 'pending'})

        if(!withdrawRequest)
            return ResponseHandler.error(res, STRING_CONSTANTS.LOAD_WITHDRAWAL_REQUEST_FAILED,HttpStatus.NO_CONTENT);

        const response = `Withdrawal of ₹${withdrawRequest.amount} is ${withdrawRequest.status}`

        return ResponseHandler.success(res,STRING_CONSTANTS.LOAD_WITHDRAWAL_REQUEST_SUCCESS,HttpStatus.OK,response)

    } catch (error) {
        console.log(STRING_CONSTANTS.SERVER,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}