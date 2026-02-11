const jwt = require('jsonwebtoken');
const User = require('../model/user.model');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET ;

const authenticate = async (req, res, next) => {
  try {
   
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح - الرجاء تسجيل الدخول'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if user exists
     const user = await User.findById(decoded.UserId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح - المستخدم غير موجود'
      });
    }

    // Attach user to request with their current data from database
    req.user = {
      UserId: user._id,
      role: String(user.role || '').trim().toLowerCase(),
      email: user.email,
      fullName: user.fullName
    };
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح - توكن غير صالح',
      error: error.message
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح - ليس لديك صلاحية للوصول'
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
