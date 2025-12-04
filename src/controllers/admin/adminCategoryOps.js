import Category from '../../model/category.js'
import ResponseHandler from '../../utils/responseHandler.js'
import HttpStatus from '../../utils/statusCodes.js'
import { STRING_CONSTANTS } from '../../utils/stringConstants.js'

// View category

export const loadCategory = async (req,res) => {
    
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 5
        const skip = (page-1) * limit
        const {search, filter} = req.query

        let sort = { createdAt: -1 }; // Default sorting (Newest first)
        let filterQuery = {}; 

        // Handle filter conditions
        if (filter === "oldest") {
            sort = { createdAt: 1 }; // Oldest first
        } else if (filter === "active") {
            filterQuery.isActive = true;
        } else if (filter === "Not-Active") {
            filterQuery.isActive = false;
        }

        // Apply search on both name & email
        if (search) {
            filterQuery.$or = [
                { name: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
            ];
        }      
         
        const categoryDetails = await Category.find(filterQuery)
        .skip(skip)
        .limit(limit)
        .sort(sort)

        const totalCategories = await Category.countDocuments(filterQuery);
        
        if(!categoryDetails || categoryDetails.length === 0) 
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
            
        return ResponseHandler.success(res, STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK,{
            categories: categoryDetails,
            total: totalCategories, 
            currentPage: page,
            totalPages: Math.ceil(totalCategories / limit),
        });

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR ,error);
        ResponseHandler.error(res, STRING_CONSTANTS.LOADING_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

//Load specific category

export const loadCategoryDetails = async (req,res) => {
    
    try {
        const {name} = req.query

        const categoryDetails = await Category.findOne({name})

        if(!categoryDetails) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
        
        return ResponseHandler.success(res, STRING_CONSTANTS.LOADING_SUCCESS, HttpStatus.OK, categoryDetails)

    } catch (error) {
        console.log(STRING_CONSTANTS.LOADING_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.LOADING_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// Add category

export const addCategory = async (req,res) => {
    
    try {
        const {name,description,icon,isActive} = req.body;
        const existCategory = await Category.findOne({name});

        if(existCategory) 
            return ResponseHandler.error(res, STRING_CONSTANTS.EXIST, HttpStatus.CONFLICT)

        await Category.create({
            name, 
            description, 
            icon, 
            isActive
        });

        return  ResponseHandler.success(res, STRING_CONSTANTS.CREATION_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log( STRING_CONSTANTS.CREATED_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.CREATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// update category

export const updateCategory = async (req,res) => {
    
    try {

        const {id,name,description,icon,isActive} = req.body
        const category = await Category.findById(id)
        if(!category)
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);

        const nameConflict = await Category.findOne({ name, _id: { $ne: id } });
        if (nameConflict) 
            return ResponseHandler.error(res, STRING_CONSTANTS.EXIST, HttpStatus.CONFLICT);

        await Category.findByIdAndUpdate(id ,{
            name,description,icon,isActive
        },{new : true})

        return  ResponseHandler.success(res, STRING_CONSTANTS.UPDATION_SUCCESS, HttpStatus.OK)
        
    } catch (error) {
        console.log(STRING_CONSTANTS.UPDATION_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.UPDATION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// delete category

export const deleteCategory = async (req,res) => {
    
    try {
        const category_ID = req.params.id;
       

        const category = await Category.findById(category_ID)
        if(!category) 
            return ResponseHandler.error(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NOT_FOUND);
        
        await Category.findByIdAndDelete(category_ID);

        return  ResponseHandler.success(res, STRING_CONSTANTS.DELETION_SUCCESS, HttpStatus.OK)

    } catch (error) {
        console.log(STRING_CONSTANTS.DELETION_ERROR, error);
        return ResponseHandler.error(res, STRING_CONSTANTS.DELETION_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
    }

}

// Add course to category

