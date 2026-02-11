const JWT = require('jsonwebtoken');
const User = require('../model/user.model');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

class AuthController {

    async register(req, res) {


        try {

            const { fullName, phone, email, password } = req.body;

            if (!fullName || !phone || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'جميع الحقول مطلوبة'
                });
            }

            // Check for duplicate email
            const existingUser = await User.findOne({ email: email });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'البريد الإلكتروني مسجل مسبقاً'
                });
            }

            // Check for duplicate phone
            const existingPhone = await User.findOne({ phone: phone });
            if (existingPhone) {
                return res.status(409).json({
                    success: false,
                    message: 'رقم الهاتف مسجل مسبقاً'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);


            const newUser = new User({
                fullName,
                phone,
                email,
                password: hashedPassword,
                role: "user"
            });

            await newUser.save();

            const token = JWT.sign({
                UserId: newUser._id,
                role: newUser.role
            },
                JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );


            const userData = await User.findById(newUser._id).select("-password").lean();

            res.json({
                success: true,
                message: 'تم إنشاء الحساب بنجاح',
                data: {
                    user: userData,
                    token
                }
            });
        } catch (error) {
            // Handle E11000 duplicate key errors
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                const message = field === 'email' ? 'البريد الإلكتروني مسجل مسبقاً' : 'رقم الهاتف مسجل مسبقاً';
                return res.status(409).json({
                    success: false,
                    message: message
                });
            }

            res.status(500).json({
                success: false,
                message: 'حدث خطأ أثناء إنشاء الحساب',
                error: error.message
            });
        }
    }
    async login(req, res) {
        try {

            const { email, password } = req.body

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'البريد الإلكتروني و كلمة المرور مطلوبان'
                });
            }

            const user = await User.findOne({ email: email });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            // const isMatch = await User.findOne({ password: password });

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
                });
            }

            const token = JWT.sign({
                UserId: user._id,
                role: user.role
            }, JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN
            });

            const userData = await User.findById(user._id).select("-password").lean();

            res.json({
                success: true,
                message: 'تم تسجيل الدخول بنجاح',
                data: {
                    user: userData,
                    token
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ أثناء تسجيل الدخول',
                error: error.message
            });
        }
    }
    async getMe(req, res) {
        try {
            const user = await User
                .findById(req.user.UserId)
                .select("-password")
                .lean();

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "المستخدم غير موجود"
                });
            }

            res.json({
                success: true,
                data: user
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "حدث خطأ",
                error: error.message
            });
        }
    }
    async logout(req, res) {
        try {
            res.json({
                success: true,
                message: 'تم تسجيل الخروج بنجاح'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ',
                error: error.message
            });
        }
    }
    async test(req, res) {
        const { password, ...rest } = req.body;

        let updateData = { ...rest };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const users = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json({
            success: true,
            data: users
        });

    }


}

module.exports = new AuthController();
