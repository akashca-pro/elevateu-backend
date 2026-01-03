import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ElevateU API Documentation',
            version: '1.0.0',
            description: `
## ElevateU Learning Platform API

A comprehensive e-learning platform API supporting:
- **Users**: Browse courses, enroll, track progress, manage wallet
- **Tutors**: Create courses, manage content, handle withdrawals
- **Admins**: Manage users, tutors, courses, categories, and analytics

### Authentication
All protected endpoints require JWT authentication via HTTP-only cookies.
            `,
            contact: {
                name: 'API Support',
                email: 'support@elevateu.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:9000',
                description: 'Development server'
            }
        ],
        tags: [
            { name: 'Auth - User', description: 'User authentication endpoints' },
            { name: 'Auth - Tutor', description: 'Tutor authentication endpoints' },
            { name: 'Auth - Admin', description: 'Admin authentication endpoints' },
            { name: 'User - Profile', description: 'User profile management' },
            { name: 'User - Courses', description: 'User course operations' },
            { name: 'User - Learning', description: 'Learning progress tracking' },
            { name: 'User - Wallet', description: 'User wallet operations' },
            { name: 'Tutor - Profile', description: 'Tutor profile management' },
            { name: 'Tutor - Courses', description: 'Tutor course management' },
            { name: 'Tutor - Wallet', description: 'Tutor earnings and withdrawals' },
            { name: 'Admin - Users', description: 'Admin user management' },
            { name: 'Admin - Tutors', description: 'Admin tutor management' },
            { name: 'Admin - Courses', description: 'Admin course management' },
            { name: 'Admin - Categories', description: 'Category management' },
            { name: 'Admin - Coupons', description: 'Coupon management' },
            { name: 'Admin - Analytics', description: 'Dashboard and analytics' },
            { name: 'Public', description: 'Public endpoints (no auth required)' },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'user_access_token',
                    description: 'JWT token stored in HTTP-only cookie'
                }
            },
            schemas: {
                // Base Response Schemas
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Error message' }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Operation successful' },
                        data: { type: 'object' }
                    }
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                total: { type: 'integer', example: 100 },
                                currentPage: { type: 'integer', example: 1 },
                                totalPages: { type: 'integer', example: 10 }
                            }
                        }
                    }
                },
                // Auth Schemas
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                        password: { type: 'string', format: 'password', minLength: 6, example: 'password123' }
                    }
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['email', 'password', 'firstName'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                        password: { type: 'string', format: 'password', minLength: 6 },
                        firstName: { type: 'string', minLength: 3, example: 'John' }
                    }
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Login successful' },
                        data: {
                            type: 'object',
                            properties: {
                                _id: { type: 'string' },
                                email: { type: 'string', format: 'email' },
                                firstName: { type: 'string' },
                                lastName: { type: 'string' },
                                profileImage: { type: 'string' },
                                isVerified: { type: 'boolean' }
                            }
                        }
                    }
                },
                // User Schema
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: 'abc123def456' },
                        email: { type: 'string', format: 'email' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        profileImage: { type: 'string' },
                        bio: { type: 'string' },
                        dob: { type: 'string', format: 'date' },
                        isVerified: { type: 'boolean' },
                        isActive: { type: 'boolean' },
                        isBlocked: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                // Tutor Schema
                Tutor: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        profileImage: { type: 'string' },
                        bio: { type: 'string' },
                        expertise: { type: 'array', items: { type: 'string' } },
                        experience: { type: 'string' },
                        isAdminVerified: { type: 'boolean' },
                        totalEarnings: { type: 'number' },
                        courseCount: { type: 'integer' }
                    }
                },
                // Course Schema
                Course: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        title: { type: 'string', example: 'Introduction to Web Development' },
                        description: { type: 'string' },
                        price: { type: 'number', example: 999 },
                        discount: { type: 'number', example: 10 },
                        thumbnail: { type: 'string' },
                        rating: { type: 'number', example: 4.5 },
                        ratingCount: { type: 'integer' },
                        enrollCount: { type: 'integer' },
                        duration: { type: 'number', description: 'Duration in hours' },
                        level: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced'] },
                        hasCertification: { type: 'boolean' },
                        status: { type: 'string', enum: ['draft', 'pending', 'approved', 'suspended'] },
                        isPublished: { type: 'boolean' },
                        tutor: { $ref: '#/components/schemas/TutorBasic' },
                        modules: { type: 'array', items: { $ref: '#/components/schemas/Module' } }
                    }
                },
                CourseBasic: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        price: { type: 'number' },
                        thumbnail: { type: 'string' },
                        rating: { type: 'number' },
                        duration: { type: 'number' },
                        level: { type: 'string' }
                    }
                },
                TutorBasic: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        firstName: { type: 'string' },
                        profileImage: { type: 'string' }
                    }
                },
                Module: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        title: { type: 'string' },
                        lessons: { type: 'array', items: { $ref: '#/components/schemas/Lesson' } }
                    }
                },
                Lesson: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        title: { type: 'string' },
                        videoUrl: { type: 'string' },
                        duration: { type: 'number' },
                        isFree: { type: 'boolean' }
                    }
                },
                // Category Schema
                Category: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string', example: 'Web Development' },
                        description: { type: 'string' },
                        icon: { type: 'string' },
                        isActive: { type: 'boolean' }
                    }
                },
                // Wallet & Transaction Schemas
                Wallet: {
                    type: 'object',
                    properties: {
                        balance: { type: 'number', example: 5000 },
                        walletId: { type: 'string' },
                        totalEarnings: { type: 'number' },
                        totalWithdrawals: { type: 'number' },
                        lastUpdated: { type: 'string', format: 'date-time' },
                        currency: { type: 'string', example: 'INR' },
                        status: { type: 'boolean' },
                        paymentMethods: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    type: { type: 'string', enum: ['gpay', 'bank'] },
                                    email: { type: 'string' },
                                    accountNumber: { type: 'string' },
                                    isDefault: { type: 'boolean' }
                                }
                            }
                        }
                    }
                },
                Transaction: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        date: { type: 'string', format: 'date-time' },
                        amount: { type: 'number' },
                        type: { type: 'string', enum: ['debit', 'credit'] },
                        purpose: { type: 'string', enum: ['course_purchase', 'withdrawal', 'commission'] },
                        platformFee: { type: 'number' },
                        status: { type: 'string', enum: ['completed', 'pending', 'processing', 'failed'] },
                        description: { type: 'string' },
                        reference: { type: 'string' }
                    }
                },
                WalletResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: {
                            type: 'object',
                            properties: {
                                walletDetails: { $ref: '#/components/schemas/Wallet' },
                                transactions: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } }
                            }
                        }
                    }
                },
                // Order Schema
                Order: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        userId: { type: 'string' },
                        userData: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                email: { type: 'string' }
                            }
                        },
                        courseId: { type: 'string' },
                        courseName: { type: 'string' },
                        paymentStatus: { type: 'string', enum: ['pending', 'success', 'failed'] },
                        price: {
                            type: 'object',
                            properties: {
                                originalPrice: { type: 'number' },
                                courseDiscount: { type: 'number' },
                                couponCode: { type: 'string' },
                                couponDiscount: { type: 'number' },
                                finalPrice: { type: 'number' }
                            }
                        },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                // Notification Schema
                Notification: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        type: { type: 'string', enum: ['publish_request', 'verify_profile', 'new_enrollment', 'payment_update', 'course_approved', 'course_rejected', 'withdraw_request', 'withdraw_approved', 'withdraw_rejected'] },
                        message: { type: 'string' },
                        isRead: { type: 'boolean' },
                        readAt: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                // Withdrawal Request Schema
                WithdrawalRequest: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        userId: { type: 'string' },
                        userName: { type: 'string' },
                        userModel: { type: 'string', enum: ['User', 'Tutor'] },
                        amount: { type: 'number' },
                        paymentMethod: { type: 'string', enum: ['gpay', 'bank'] },
                        email: { type: 'string' },
                        status: { type: 'string', enum: ['pending', 'processing', 'completed', 'rejected'] },
                        adminNote: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                // Coupon Schema
                Coupon: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        code: { type: 'string', example: 'SAVE20' },
                        discount: { type: 'number' },
                        discountType: { type: 'string', enum: ['fixed', 'percent'] },
                        minAmount: { type: 'number' },
                        maxDiscount: { type: 'number' },
                        usageLimit: { type: 'integer' },
                        usageCount: { type: 'integer' },
                        expiresAt: { type: 'string', format: 'date-time' },
                        isActive: { type: 'boolean' }
                    }
                },
                // Enrolled Course Schema
                EnrolledCourse: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        courseId: { type: 'string' },
                        course: { $ref: '#/components/schemas/CourseBasic' },
                        progress: { type: 'number', example: 45.5 },
                        completedLessons: { type: 'array', items: { type: 'string' } },
                        isCompleted: { type: 'boolean' },
                        enrolledAt: { type: 'string', format: 'date-time' }
                    }
                },
                // Bank Details Schema
                BankDetails: {
                    type: 'object',
                    properties: {
                        accountNumber: { type: 'string', example: '1234567890' },
                        ifsc: { type: 'string', example: 'HDFC0001234' },
                        bankName: { type: 'string', example: 'HDFC Bank' },
                        holderName: { type: 'string', example: 'John Doe' }
                    }
                },
                // Dashboard Analytics Schema
                DashboardAnalytics: {
                    type: 'object',
                    properties: {
                        totalUsers: { type: 'integer' },
                        totalTutors: { type: 'integer' },
                        totalCourses: { type: 'integer' },
                        totalRevenue: { type: 'number' },
                        totalOrders: { type: 'integer' },
                        pendingWithdrawals: { type: 'integer' }
                    }
                }
            },
            responses: {
                UnauthorizedError: {
                    description: 'Authentication required - Token not found or expired',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { success: false, message: 'Token not found' }
                        }
                    }
                },
                ForbiddenError: {
                    description: 'Access denied - User is blocked or not authorized',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { success: false, message: 'Access denied' }
                        }
                    }
                },
                NotFoundError: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { success: false, message: 'Data not found' }
                        }
                    }
                },
                ValidationError: {
                    description: 'Validation failed',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { success: false, message: 'Validation failed', errors: [] }
                        }
                    }
                },
                RateLimitError: {
                    description: 'Too many requests - Rate limit exceeded',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: false },
                                    message: { type: 'string', example: 'Too many requests. Please try again after 15 minutes.' },
                                    retryAfter: { type: 'integer', example: 900 }
                                }
                            }
                        }
                    }
                },
                ConflictError: {
                    description: 'Resource already exists',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: { success: false, message: 'Already exists' }
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
