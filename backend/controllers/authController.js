const mongoose = require('mongoose');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database offline: MongoDB is not running or unreachable. Please start MongoDB locally or set a valid MONGO_URI in backend/.env.'
      });
    }

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Check for user (must explicitly select password since select: false)
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Check your credentials or contact your administrator.'
      });
    }

    // Check account status
    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.status.toLowerCase()}. Please contact the administrator.`
      });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Return user details (without password)
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      designation: user.designation,
      location: user.location,
      phoneNumber: user.phoneNumber,
      status: user.status
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update editable fields on the authenticated user's profile
// @route   PUT /api/auth/profile
// @access  Private
const updateOwnProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phoneNumber, location, designation } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return res.status(400).json({ success: false, message: 'First name, last name, and email are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const duplicateEmail = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
    if (duplicateEmail) {
      return res.status(409).json({ success: false, message: 'That email address is already in use.' });
    }

    const allowedLocations = ['Domlur', 'Devanahalli', 'Kovilpatti', 'Hyderabad'];
    if (location && !allowedLocations.includes(location)) {
      return res.status(400).json({ success: false, message: 'Please choose a valid location.' });
    }

    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.email = normalizedEmail;
    user.phoneNumber = typeof phoneNumber === 'string' ? phoneNumber.trim() : '';
    if (location) user.location = location;
    user.designation = user.role === 'Employee' ? (designation || '').trim() : null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role,
        designation: user.designation,
        location: user.location,
        phoneNumber: user.phoneNumber,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change the authenticated user's password
// @route   PATCH /api/auth/change-password
// @access  Private
const changeOwnPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your current password, new password, and confirmation.'
      });
    }
    if (newPassword.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirmation do not match.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginUser,
  getMe,
  updateOwnProfile,
  changeOwnPassword
};
