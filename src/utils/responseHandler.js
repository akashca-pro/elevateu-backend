import HttpStatus from './statusCodes.js'

class ResponseHandler {
    static success(res,message='success', statusCode = HttpStatus.OK, data=null){
        return res.status(statusCode).json({
            success : true,
            message,
            data
        })
    }

    static error(res, message='Something went wrong', statusCode = HttpStatus.INTERNAL_SERVER_ERROR, error = null){
        return res.status(statusCode).json({
            success : false,
            message,
            error : error?.message  
        })
    }

}

export default ResponseHandler