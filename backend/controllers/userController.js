const User = require('../models/User');
const { sendWelcomeEmail } = require('../utils/emailService');

// @desc    Get all users with search, filtering and pagination
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;

    const query = {};

    // Filter by role
    if (role && role !== 'All') {
      query.role = role;
    }

    // Filter by Status
    if (status && status !== 'All') {
      query.status = status;
    }

    // Search by Name, Email or Employee ID
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('createdBy', 'firstName lastName email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      employeeId,
      role = 'Employee',
      designation,
      location = 'Domlur',
      phoneNumber = '',
      status = 'Active'
    } = req.body;

    // 1. Validate required fields
    if (!firstName || !lastName || !email || !password || !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide firstName, lastName, email, password and employeeId'
      });
    }

    // 2. Enforce MISTRAL prefix rule on Employee ID
    if (!employeeId.startsWith('MISTRAL')) {
      return res.status(400).json({
        success: false,
        message: "Employee ID must start with the 'MISTRAL' prefix (e.g., MISTRAL-001)"
      });
    }

    // 3. Enforce Singleton rule for Admin: Only ONE Admin allowed in the system
    if (role === 'Admin') {
      const existingAdmin = await User.findOne({ role: 'Admin' });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'System restriction: Only one Admin account is permitted in the system.'
        });
      }
    }

    // 4. Enforce Singleton rule for Asset Manager: Only ONE Asset Manager allowed in the system
    if (role === 'Asset Manager') {
      const existingManager = await User.findOne({ role: 'Asset Manager' });
      if (existingManager) {
        return res.status(400).json({
          success: false,
          message: 'System restriction: Only one Asset Manager account is permitted in the system.'
        });
      }
    }

    // 5. Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    // 6. Check if employeeId already exists
    const employeeIdExists = await User.findOne({ employeeId });
    if (employeeIdExists) {
      return res.status(400).json({
        success: false,
        message: `Employee ID '${employeeId}' is already assigned to another user.`
      });
    }

    // 7. Enforce conditional designation: ONLY Employee has designation
    const finalDesignation = role === 'Employee' ? (designation || 'Other') : null;

    // 8. Create user
    const newUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      employeeId,
      role,
      designation: finalDesignation,
      location,
      phoneNumber,
      status,
      createdBy: req.user._id
    });

    const userResponse = await User.findById(newUser._id).select('-password');
    let welcomeEmailSent = false;

    try {
      await sendWelcomeEmail({
        firstName: userResponse.firstName,
        lastName: userResponse.lastName,
        email: userResponse.email,
        password,
        role: userResponse.role
      });
      welcomeEmailSent = true;
    } catch (emailError) {
      console.error(`Welcome email could not be sent to ${userResponse.email}:`, emailError.message);
    }

    res.status(201).json({
      success: true,
      message: welcomeEmailSent
        ? `User '${userResponse.firstName} ${userResponse.lastName}' created successfully as ${userResponse.role}. Login credentials were emailed.`
        : `User '${userResponse.firstName} ${userResponse.lastName}' was created as ${userResponse.role}, but the welcome email could not be sent. Check the Gmail settings and server connection.`,
      welcomeEmailSent,
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      employeeId,
      role,
      designation,
      location,
      phoneNumber,
      status
    } = req.body;

    // 1. Employee ID validation if changed
    if (employeeId && employeeId !== user.employeeId) {
      if (!employeeId.startsWith('MISTRAL')) {
        return res.status(400).json({
          success: false,
          message: "Employee ID must start with the 'MISTRAL' prefix (e.g., MISTRAL-001)"
        });
      }
      const employeeIdExists = await User.findOne({ employeeId, _id: { $ne: user._id } });
      if (employeeIdExists) {
        return res.status(400).json({
          success: false,
          message: `Employee ID '${employeeId}' is already assigned to another user.`
        });
      }
      user.employeeId = employeeId;
    }

    // 2. Email uniqueness check if changed
    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email address already exists.'
        });
      }
      user.email = email.toLowerCase();
    }

    // 3. Role update validations
    if (role && role !== user.role) {
      // Prevent demoting the only Admin if it leaves 0 Admins
      if (user.role === 'Admin' && role !== 'Admin') {
        const adminCount = await User.countDocuments({ role: 'Admin' });
        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot demote the primary Admin. At least one Admin must exist.'
          });
        }
      }

      // Prevent creating a second Admin
      if (role === 'Admin') {
        const existingAdmin = await User.findOne({ role: 'Admin', _id: { $ne: user._id } });
        if (existingAdmin) {
          return res.status(400).json({
            success: false,
            message: 'System restriction: Only one Admin account is permitted in the system.'
          });
        }
      }

      // Prevent creating a second Asset Manager
      if (role === 'Asset Manager') {
        const existingManager = await User.findOne({ role: 'Asset Manager', _id: { $ne: user._id } });
        if (existingManager) {
          return res.status(400).json({
            success: false,
            message: 'System restriction: Only one Asset Manager account is permitted in the system.'
          });
        }
      }

      user.role = role;
    }

    // 4. Conditional designation rule: ONLY Employee gets designation
    if (user.role === 'Employee') {
      if (designation !== undefined) {
        user.designation = designation;
      }
    } else {
      user.designation = null;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (location !== undefined) user.location = location;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (status !== undefined) {
      // Prevent deactivating the only Admin
      if (user.role === 'Admin' && status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: 'The system Admin account cannot be deactivated or suspended.'
        });
      }
      user.status = status;
    }

    // Update password if provided
    if (password && password.trim().length >= 6) {
      user.password = password; // Will be hashed by pre-save hook
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');

    res.status(200).json({
      success: true,
      message: `User '${updatedUser.firstName} ${updatedUser.lastName}' updated successfully.`,
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change a user's password after verifying the current password
// @route   PATCH /api/users/:id/password
// @access  Private/Admin
const changeUserPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the current password, new password, and confirmation.'
      });
    }
    if (newPassword.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirmation do not match.' });
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (!(await user.matchPassword(currentPassword))) {
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

// @desc    Toggle user status (Active / Inactive)
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'The system Admin account cannot be deactivated.'
      });
    }

    // Toggle status
    user.status = user.status === 'Active' ? 'Inactive' : 'Active';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User status changed to ${user.status}.`,
      status: user.status
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the system Admin account.'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `User '${user.firstName} ${user.lastName}' (${user.employeeId}) has been deleted.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  changeUserPassword,
  toggleUserStatus,
  deleteUser
};
