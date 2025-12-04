import Course from "../../model/course.js";
import Order from "../../model/order.js";
import Transaction from "../../model/transaction.js";
import Tutor from "../../model/tutor.js";
import User from "../../model/user.js";
import Wallet from "../../model/wallet.js";
import ResponseHandler from "../../utils/responseHandler.js";
import HttpStatus from "../../utils/statusCodes.js";
import { STRING_CONSTANTS } from "../../utils/stringConstants.js"

// best selling courses

export const bestSellingCourse = async (req,res) => {
    
    try {
        const {fromDate, toDate} = req.query;

        const matchStage = {
            paymentStatus: 'success',
          };
          
          if (fromDate && toDate) {
            matchStage.createdAt = {
              $gte: new Date(fromDate),
              $lte: new Date(toDate), 
            };
          }

        const courses = await Order.aggregate([ 
            { $match: matchStage },
            { $group : { _id : '$courseId' , totalSales : { $sum : 1 } } },
            { $sort : { totalSales : -1 } },
            { $limit : 10 },
            {
                $lookup : {
                    from : 'courses',
                    localField : '_id',
                    foreignField : '_id',
                    as : 'courses'
                }
            },
            { $unwind : '$courses' },
            {
                $lookup: {
                  from: 'tutors', 
                  localField: 'courses.tutor',
                  foreignField: '_id',
                  as: 'tutor'
                }
            },
            {
                $unwind : '$tutor'
            },
            {
                $project: {
                  _id: 1,
                  totalSales: 1,
            
                  // Course specific fields
                  'courseId': '$courses._id',
                  'title': '$courses.title',
                  'tutorId': '$courses.tutor',
                  'category': '$courses.category',
                  'thumbnail': '$courses.thumbnail',
                  'description': '$courses.description',
                  'createdAt': '$courses.createdAt',
                  'price': '$courses.price',
                  'isFree': '$courses.isFree',
                  'level': '$courses.level',
                  'isArchive' : '$courses.isArchive',
            
                  // Tutor specific fields 
                  'tutorName': '$tutor.firstName',
                  'tutorEmail': '$tutor.email',
                  'tutorImage': '$tutor.profileImage'
                }
              }
         ])
         
         if(!courses || courses.length === 0)
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NO_CONTENT);
         

          return ResponseHandler.success(res, STRING_CONSTANTS.LOAD_BEST_SELLING_COURSE_SUCCESS, HttpStatus.OK,
          courses.filter(c=>!c.isArchive))

    } catch (error) {
        console.log(STRING_CONSTANTS.SERVER,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// best selling category

export const bestSellingCategory = async (req,res) => {
    
    try {
        const {fromDate, toDate} = req.query;

        const matchDate = {
            paymentStatus : 'success'
        }

        if(fromDate && toDate){
            matchDate.createdAt = { $gte : new Date(fromDate), $lte : new Date(toDate) }
        }

        const categories = await Order.aggregate([
            { $match : matchDate },
            { $group : { _id : '$categoryId', totalSales : { $sum : 1 } } },
            { $sort : { totalSales : -1 } },
            { $limit : 10 },
            {
                $lookup : {
                    from : 'categories',
                    localField : '_id',
                    foreignField : '_id',
                    as : 'categories'
                }
            },
            { $unwind : '$categories' },
            { $project : {
                _id : 1,
                totalSales : 1,
                'title' : '$categories.name',
                'thumbnail' : '$categories.icon'
            } }
            
        ])
        
        if(!categories || categories.length === 0)
            return ResponseHandler.success(res, STRING_CONSTANTS.DATA_NOT_FOUND, HttpStatus.NO_CONTENT);

        return ResponseHandler.success(res, STRING_CONSTANTS.LOAD_BEST_SELLING_CATEGORY_SUCCESS, HttpStatus.OK, categories)

    } catch (error) {
        console.log(STRING_CONSTANTS.SERVER,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}
 
// dashboardDetails  

export const dashboardDetails = async (req,res) => {
    
    try {
        const adminId = req.admin.id
        const totalStudents = await User.countDocuments();
        const totalTutors = await Tutor.countDocuments();
        const totalCourses = await Course.countDocuments();

        const { totalEarnings } = await Wallet.findOne({ userId : adminId, userModel : 'Admin' })
        .select('-_id totalEarnings').lean()

        ResponseHandler.success(res,STRING_CONSTANTS.LOAD_DASHBOARD_DETAILS_SUCCESS,HttpStatus.OK,{
            totalStudents,
            totalTutors,
            totalEarnings : totalEarnings.toFixed(2),
            totalCourses
        })

    } catch (error) {
        console.log(STRING_CONSTANTS.SERVER,error);
        return ResponseHandler.error(res, STRING_CONSTANTS.SERVER, HttpStatus.INTERNAL_SERVER_ERROR)
    }

}

// Revenue data for chart analysis

export const revenueChartAnalysis = async (req, res) => {
    try {
  
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const month = parseInt(req.query.month); // Optional, only needed for monthly and weekly view
      const viewType = req.query.viewType || 'yearly';
  
      const matchFilter = { type: 'course_purchase' };
  
      let groupStage = {};
      let projectData = [];
  
      if (viewType === 'yearly') {
        // Yearly View: Monthly Aggregation
        matchFilter.createdAt = {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`)
        };
  
        groupStage = {
          _id: { month: { $month: "$createdAt" } },
          totalRevenue: { $sum: "$amount.adminPayout" }
        };
  
        projectData = Array.from({ length: 12 }, (_, i) => {
          const monthName = new Date(0, i).toLocaleString('default', { month: 'short' });
          return { month: monthName, income: 0, profit: 0 };
        });
      }
  
      else if (viewType === 'monthly') {
        // Monthly View: Daily Aggregation
        if (!month) {
          return res.status(400).json({ message: "Month is required for monthly view" });
        }
  
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 1);
  
        matchFilter.createdAt = {
          $gte: startOfMonth,
          $lt: endOfMonth
        };
  
        groupStage = {
          _id: { day: { $dayOfMonth: "$createdAt" } },
          totalRevenue: { $sum: "$amount.adminPayout" }
        };
  
        const daysInMonth = new Date(year, month, 0).getDate();
  
        projectData = Array.from({ length: daysInMonth }, (_, i) => ({
          date: `${i + 1}`, income: 0, profit: 0
        }));
      }
  
      else if (viewType === 'weekly') {
        // Weekly View: Week-wise Aggregation for the selected month
        if (!month) {
          return res.status(400).json({ message: "Month is required for weekly view" });
        }
  
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0); // last day of the month
  
        matchFilter.createdAt = {
          $gte: startOfMonth,
          $lt: new Date(endOfMonth.getFullYear(), endOfMonth.getMonth(), endOfMonth.getDate() + 1)
        };
  
        groupStage = {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            week: {
              $ceil: { $divide: [{ $dayOfMonth: "$createdAt" }, 7] }  // Week number in the month
            }
          },
          totalRevenue: { $sum: "$amount.adminPayout" }
        };
  
        // Assume up to 5 weeks in a month
        projectData = Array.from({ length: 5 }, (_, i) => ({
          week: `Week ${i + 1}`,
          income: 0,
          profit: 0
        }));
      }
  
      const revenueData = await Transaction.aggregate([
        { $match: matchFilter },
        { $group: groupStage },
        { $sort: { "_id": 1 } }
      ]);
  
      // Fill the chart data based on the view
      if (viewType === 'yearly') {
        revenueData.forEach(r => {
          const monthIndex = r._id.month - 1;
          projectData[monthIndex].income = r.totalRevenue;
          projectData[monthIndex].profit = r.totalRevenue;
        });
      }
  
      else if (viewType === 'monthly') {
        revenueData.forEach(r => {
          const dayIndex = r._id.day - 1;
          if (projectData[dayIndex]) {
            projectData[dayIndex].income = r.totalRevenue;
            projectData[dayIndex].profit = r.totalRevenue;
          }
        });
      }
  
      else if (viewType === 'weekly') {
        revenueData.forEach(r => {
          const weekIndex = r._id.week - 1; // week is 1-based
          if (projectData[weekIndex]) {
            projectData[weekIndex].income = r.totalRevenue;
            projectData[weekIndex].profit = r.totalRevenue;
          }
        });
      }
  
      return ResponseHandler.success(
        res,
        STRING_CONSTANTS.LOAD_CHART_DATA_SUCCESS,
        HttpStatus.OK,
        projectData
      );
  
    } catch (error) {
      console.error(STRING_CONSTANTS.SERVER, error);
      return ResponseHandler.error(
        res,
        STRING_CONSTANTS.SERVER,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  };