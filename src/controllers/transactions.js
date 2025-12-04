import Admin from "../model/admin.js";
import Transaction from "../model/transaction.js";
import Tutor from "../model/tutor.js";
import User from "../model/user.js";
import Wallet from "../model/wallet.js";
import WithdrawalRequest from "../model/withdrawRequest.js";
import { saveNotification, sendNotification } from "../utils/LiveNotification.js";
import ResponseHandler from "../utils/responseHandler.js";
import HttpStatus from "../utils/statusCodes.js";
import { STRING_CONSTANTS } from "../utils/stringConstants.js";

const roleModels = {
    User : User,
    Tutor : Tutor,
    Admin : Admin
}

const sortingConditions = {
    'latest' : { createdAt : -1 },
    'oldest' : { createdAt : 1 },
    'price-high-low' : { amount : -1 },
    'price-low-high' : { amount : 1 },
}

const source = {
    'User' : {nameLabel : 'userId', amountLabel : 'userPayout', transactionType : 'user_withdrawal'},
    'Tutor' : {nameLabel : 'tutorId', amountLabel : 'tutorPayout', transactionType : 'tutor_withdrawal'},
    'Admin' : {nameLabel : 'adminId', amountLabel : 'adminPayout', transactionType : 'admin_withdrawal'}
}


const handleWithdrawalTransaction = async ({ role ,id, amount}) => {
    try {

        const roundedAmount = parseFloat(amount.toFixed(2));

        const transaction = await Transaction.create({
            type : source[role].transactionType,
            source : {
                [source[role].nameLabel] : id
            },
            amount : {
                [source[role].amountLabel] : roundedAmount
            }
        })

        // create withdraw transaction data
        const withdrawTransaction = {
            transactionId : transaction._id,
            type: 'debit',
            amount : roundedAmount,
            purpose: 'withdrawal',
            status: 'completed',
            description: `You withdrew ${roundedAmount} `  
        }

        await Wallet.updateOne(
            { userId : id, userModel : role },
            {
                $push : { transactions : withdrawTransaction },
                $inc : { balance : -roundedAmount , totalWithdrawals : roundedAmount}
            }
        )

    } catch (error) {
        throw error
    }

}

// load wallets of tutor , admin and user

export const loadWalletDetails = (role) => async (req,res) => {
    
    try {
        const userId = req[role.toLowerCase()].id
        const limit = parseInt(req.query.limit) || 20;
        const wallet = await Wallet.findOne({ userId , userModel : role })

        if(!wallet)
            return ResponseHandler.success(res, STRING_CONSTANTS.LOADING_WALLET_ERROR, HttpStatus.NO_CONTENT)

        const db = roleModels[role];

        const user = await db.findById(userId);

        let acctno = '4567';

        if(role === 'Tutor'){
            
            acctno = user?.bankDetails?.accountNumber?.slice(-4)
        }

        const walletDetails = role !== 'User' ? {
            balance : wallet.balance,
            walletId : wallet._id,
            totalEarnings : wallet?.totalEarnings || 0,
            totalWithdrawals : wallet?.totalWithdrawals || 0,
            lastUpdated : wallet.updatedAt.toISOString(),
            currency : 'INR',
            status : wallet.isActive,
            paymentMethods: [
                { id: "pm1", type: "gpay", email: `${user.email}` , isDefault: false },
                { id: "pm2", type: "bank", accountNumber: `xxxx-xxxx-xxxx-${acctno}`, isDefault: true },
              ],
        } : null

        const transactions = wallet.transactions
        .sort((a,b)=>new Date(b.createdAt) - new Date(a.createdAt) )
        .slice(0,limit)
        .map((transaction,index)=>{
       
            return {
                id : index + 1,
                date : transaction.updatedAt.toISOString(),
                amount : transaction.amount,
                type : transaction.type,
                purpose : transaction.purpose,
                platformFee : role === 'Tutor' ? transaction.platformFee : undefined,
                status : transaction.status,
                description : transaction.description,
                reference : transaction.transactionId
            }
        });

        return ResponseHandler.success(res, STRING_CONSTANTS.LOADING_WALLET_SUCCESS, HttpStatus.OK,{
            walletDetails, 
            transactions : (transactions && transactions.length > 0 ) ? transactions : []
        })
        

    } catch (error) {
        console.log(STRING_CONSTANTS.SERVER,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// load withdraw requests 

export const loadWithdrawRequests = async (req,res) => {
    
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 5
        const skip = (page-1) * limit
        
        let filter = {status : 'pending'};
        let sort
        if (req.query.filter) {
            try {
              const parsedFilter = JSON.parse(req.query.filter);
                sort = sortingConditions[parsedFilter.sort] || { createdAt: -1 };
          
              if (parsedFilter.search) {
                filter.email = { $regex: parsedFilter.search, $options: "i" };
              }
              
            } catch (error) {
              return ResponseHandler.error(
                res,
                STRING_CONSTANTS.INVALID_FILTER,
                HttpStatus.BAD_REQUEST
              );
            }
          }

        const totalRequest = await WithdrawalRequest.countDocuments(filter)

        const requests = await WithdrawalRequest.find(filter)
        .select('-bankDetails')
        .skip(skip)
        .limit(limit)
        .sort(sort)

        if(!requests || requests.length === 0)
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.OK,{
                requests: [],
                total: 0,
                currentPage: page,
                totalPages: 0,
            })

        return ResponseHandler.success(res,STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK, {
            requests,
            total: totalRequest, 
            currentPage: page,
            totalPages: Math.ceil(totalRequest / limit)
        })

    } catch (error) {
        console.log(STRING_CONSTANTS.SERVER,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// approve or reject withdraw request , if approve start withraw transction for tutor

export const approveOrRejectWithdrawRequest = async (req,res) => {
    
    try {
        const { input, id, reason } = req.body;
        const request = await WithdrawalRequest.findById(id)
        
        if (['completed', 'rejected'].includes(request.status)) {
            return ResponseHandler.success(res, STRING_CONSTANTS.EXIST, HttpStatus.ALREADY_REPORTED);
        }

        if(input === 'approve'){
            await handleWithdrawalTransaction({
                 role : request.userModel,
                 id : request.userId,
                amount : request.amount, });
            
            request.status = 'completed'
            request.adminNote = reason ? reason : undefined

            await request.save()

            const newNotification = await saveNotification(request.userId, 
                request.userModel, 'withdraw_approved', 
                `Withdraw request approved for your amount ₹${request.amount} ${reason ? reason : ''}`)
            
            sendNotification(req, newNotification)

            return ResponseHandler.success(res, STRING_CONSTANTS.WITHDRAW_REQUEST_APPROVED, HttpStatus.OK)
        }

        if(input === 'reject'){
        
           request.status = 'rejected';
           request.adminNote = reason ? reason : undefined
           await request.save()

           const newNotification = 
           await saveNotification(request.userId, 
            request.userModel, 'withdraw_rejected', 
            `Withdraw request rejected for your amount ₹${request.amount} ${reason ? reason : ''}`)

            sendNotification(req, newNotification)

            return ResponseHandler.success(res, STRING_CONSTANTS.WITHDRAW_REQUEST_REJECTED, HttpStatus.OK)
        }

        return ResponseHandler.error(res, STRING_CONSTANTS.INVALID_ACTION_TYPE, HttpStatus.BAD_REQUEST);

    } catch (error) {
        console.log(STRING_CONSTANTS.SERVER,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// withdrawal for admin

export const adminWithdrawAmount = async (req,res) => {
    
    try {
        const adminId = req.admin.id;
        const { formData } = req.body;

        if(!formData)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND,HttpStatus.BAD_REQUEST)
        
        const wallet = await Wallet.findOne({ userId : adminId, userModel : 'Admin' });

        if(!wallet)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        if(wallet.balance < formData.amount)
            return ResponseHandler.error(res, STRING_CONSTANTS.INSUFFICIENT_FUNDS, HttpStatus.BAD_REQUEST);

        await handleWithdrawalTransaction({ role : 'Admin', id : adminId, amount : formData?.amount })

        return ResponseHandler.success(res, STRING_CONSTANTS.WITHDRAW_SUCCESS,HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.SERVER,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

