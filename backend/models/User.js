const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Do not return password by default in queries
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Rule: Employee ID must strictly start with MISTRAL
          return typeof v === 'string' && v.startsWith('MISTRAL');
        },
        message: (props) =>
          `Employee ID '${props.value}' is invalid. It must start with the prefix 'MISTRAL' (e.g., MISTRAL-001)`
      }
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: ''
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['Admin', 'Asset Manager', 'Support Team', 'Employee'],
        message: '{VALUE} is not a valid role. Allowed roles are Admin, Asset Manager, Support Team, Employee'
      },
      default: 'Employee'
    },
    // Designation is ONLY applicable for Employee role; null for all other roles
    designation: {
      type: String,
      default: null,
      trim: true
    },
    location: {
      type: String,
      enum: [
        'Domlur',
        'Devanahalli',
        'Kovilpatti',
        'Hyderabad'
      ],
      default: 'Domlur'
    },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active'
    },
    isEmailVerified: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    passwordChangedAt: {
      type: Date
    },
  },
  {
    timestamps: true
  }
);

// Pre-save middleware: Enforce designation business rule & hash password
userSchema.pre('save', async function (next) {
  // Business rule: designation is ONLY for Employee role
  if (this.role !== 'Employee') {
    this.designation = null;
  }

  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
