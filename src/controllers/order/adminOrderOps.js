import Order from "../../model/order.js"
import ResponseHandler from "../../utils/responseHandler.js";
import HttpStatus from "../../utils/statusCodes.js";
import { STRING_CONSTANTS } from "../../utils/stringConstants.js";


export const loadOrderDetails = async (req,res) => {
    
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page-1) * limit;
        const { search, filter, sort } = req.query;

        let sortQuery = { createdAt : -1 }
        let filterQuery = {};

         // Handle filter conditions
        if (filter === "Pending") {
            filterQuery.status = 'pending';
        } else if (filter === "Success") {
            filterQuery.paymentStatus = 'success';
        } else if(filter === "Failed"){
            filterQuery.paymentStatus = 'failed'
        }

        // Handle sort conditions
        if(sort === 'Oldest'){
            sortQuery = { createdAt : 1 }
        }
        else if(sort === 'Price-high-to-low'){
            sortQuery = { 'price.finalPrice' : -1 }
        }else if(sort === 'Price-low-to-high'){
            sortQuery = { 'price.finalPrice' : 1 }
        }


        if (search) {
            filterQuery.$or =[ { courseName :  { $regex : search , $options : "i"  } }, 
                { 'userData.name' : { $regex : search, $options : 'i' }  },
                { 'userData.email' : { $regex : search, $options : 'i' }  },
                { 'courseName' : { $regex  : search, $options : 'i'  } } 
             ]                  
        }  

        const totalOrders = await Order.countDocuments(filterQuery)
        
        const orders = await Order.find(filterQuery)
        .skip(skip)
        .limit(limit)
        .sort(sortQuery)

        return ResponseHandler.success(res, STRING_CONSTANTS.LOADING_SUCCESS,HttpStatus.OK,{
            orders,
            total : totalOrders,
            currentPage : page,
            totalPages : Math.ceil( totalOrders / limit )
        })

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR,error);
        return ResponseHandler.error(res,STRING_CONSTANTS.SERVER,HttpStatus.INTERNAL_SERVER_ERROR);
    }

}
