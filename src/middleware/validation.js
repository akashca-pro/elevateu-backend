import { body, validationResult } from 'express-validator'

const commonValidations = {

        register : [
        body('email').isEmail().withMessage('Invalid email format'),
        body('password').isLength({ min : 6 })
        .matches(/^(?=.*[0-9])(?=.*[!@#$%^&*])/, "g")
        .withMessage('Password must include at least one number and one special character'),
        body('firstName').isLength({ min : 3 })
        .matches(/^[A-Za-z\s]+$/)
        .withMessage('First name should not contain numbers or special characters'),
        ],
        
        login : [
        body('email').isEmail().withMessage('Invalid email format'),
        body('password').isLength({ min : 6 })
        .matches(/^(?=.*[0-9])(?=.*[!@#$%^&*])/, "g")
        .withMessage('Password must include at least one number and one special character'),
        ],

        profile : [
        body('lastName').isLength({ min : 3 })
        .matches(/^[A-Za-z\s]+$/)
        .withMessage('Last name should not contain numbers or special characters'),
        ]
}

const roleValidations = {
    user : {
        login : [
            ...commonValidations.login
        ],
        register : [
            ...commonValidations.register
        ],
        profile : [
            ...commonValidations.profile,
            body('phone').isLength({ min : 10 }).withMessage('Invalid phone number'),
            body('dob').notEmpty().withMessage('Date of birth is required'),
            body('bio').notEmpty().withMessage('Bio is required')
        ]
    },
    tutor : {
        login : [
            ...commonValidations.login
        ],
        register : [
            ...commonValidations.register
        ],
        profile : [
            ...commonValidations.profile,
            body('phone').isLength({ min : 10 }).withMessage('Invalid phone number'),
            body('dob').notEmpty().withMessage('Date of birth is required'),
            body('bio').notEmpty().withMessage('Bio is required'),
            body('expertise').notEmpty().withMessage('Expertise is required'),
            body('experience').notEmpty().withMessage('Experience is required'),
        ],
        course: [
            body('courseDetails.title')
              .optional()
              .trim()
              .isLength({ min: 5 })
              .withMessage('Course title must be at least 5 characters'),
          
            body('courseDetails.description')
              .optional()
              .trim()
              .isLength({ min: 10 })
              .withMessage('Course description must be at least 10 characters'),
          
            body('courseDetails.category')
              .optional()
              .notEmpty()
              .withMessage('Course category is required'),
          
            body('courseDetails.isFree')
              .optional()
              .isBoolean()
              .withMessage('isFree must be a boolean'),
          
            body('courseDetails.whatYouLearn')
              .optional()
              .isArray({ min: 1 })
              .withMessage('At least one item in "what you learn" is required'),
          
            body('courseDetails.price')
              .optional()
              .custom((value, { req }) => {
                if (
                  req.body.courseDetails?.isFree === false &&
                  (typeof value !== 'number' || value <= 0)
                ) {
                  throw new Error('Price must be greater than 0 if course is not free');
                }
                return true;
              }),
          
            body('courseDetails.thumbnail')
              .optional()
              .notEmpty()
              .withMessage('Course thumbnail is required'),
          
            body('courseDetails.modules')
              .optional()
              .isArray({ min: 1 })
              .withMessage('At least one module is required'),
          
            body('courseDetails.modules.*.title')
              .optional()
              .trim()
              .isLength({ min: 5 })
              .withMessage('Module title must be at least 5 characters'),
          
            body('courseDetails.modules.*.lessons')
              .optional()
              .isArray({ min: 1 })
              .withMessage('Each module must have at least one lesson'),
          
            body('courseDetails.modules.*.lessons.*.title')
              .optional()
              .trim()
              .isLength({ min: 3 })
              .withMessage('Lesson title must be at least 3 characters'),
          
            body('courseDetails.modules.*.lessons.*.videoUrl')
              .optional()
              .trim()
              .notEmpty()
              .withMessage('Each lesson must have a video URL'),
          
            body('courseDetails.modules.*.lessons.*.duration')
              .optional()
              .notEmpty().withMessage('Duration is required')
              .isNumeric().withMessage('Duration must be a number')
              .custom((value) => {
                if (Number(value) <= 0) {
                  throw new Error('Duration must be greater than zero');
                }
                return true;
              })
          ]
          

    },
    admin : {
        login : [
            ...commonValidations.login
        ],
        register : [
            ...commonValidations.register
        ],
        profile : [
            ...commonValidations.profile,
            body('email').isEmail().withMessage('Invalid email format'),
        ],
        coupon :[
            body("formData.code")
                .trim()
                .notEmpty().withMessage("Coupon code is required")
                .isLength({ min: 3, max: 20 }).withMessage("Coupon code must be between 3 to 20 characters")
                .matches(/^[A-Z0-9]+$/).withMessage("Coupon code must be uppercase letters and numbers only"),
            
            body("formData.discountType")
                .isIn(["percentage", "fixed"]).withMessage("Discount type must be 'percentage' or 'fixed'"),
        
            body("formData.discountValue")
                .isNumeric().withMessage("Discount value must be a number")
                .isFloat({ gt: 0 }).withMessage("Discount value must be greater than zero"),
        
            body("formData.minPurchaseAmount")
                .optional()
                .isNumeric().withMessage("Minimum purchase amount must be a number")
                .isFloat({ gt: 0 }).withMessage("Minimum purchase amount must be greater than zero"),
        
            body("formData.maxDiscount")
                .optional()
                .isNumeric().withMessage("Max discount must be a number")
                .isFloat({ gt: 0 }).withMessage("Max discount must be greater than zero"),
        
            body("formData.expiryDate")
                .notEmpty().withMessage("Expiry date is required")
                .isISO8601().toDate().withMessage("Invalid date format, use ISO8601 format"),
        
            body("formData.usageLimit")
                .optional()
                .isInt({ gt: 0 }).withMessage("Usage limit must be a positive integer"),
            
            body("formData.status")
                .optional()
                .isBoolean().withMessage("Status must be true or false"),
        ]
    }
}

export const validateForm = (role, formType) => async(req,res,next) =>{

   await Promise.all(roleValidations[role][formType].map(validation=> validation.run(req)));

   const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array()});
  }
  next();

}