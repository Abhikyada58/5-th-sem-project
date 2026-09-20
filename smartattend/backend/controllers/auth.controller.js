const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auditService = require('../services/audit.service');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: true, // MUST be true for sameSite: 'none'
    sameSite: 'none', // Allows cross-origin cookies
  };

  user.passwordHash = undefined;

  res.status(statusCode).cookie('jwt', token, options).json({
    success: true,
    token,
    user
  });
};

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role, studentId, classId } = req.body;

    // Validate role is one of allowed (just extra safety, model enum also handles it)
    if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      email,
      passwordHash,
      role,
      studentId: (role === 'STUDENT' && studentId) ? studentId : undefined,
      classId: (role === 'STUDENT' && classId) ? classId : undefined,
    });

    // Audit Log: Account Creation
    // (If created by an admin, req.user would exist. Since register is public right now, we use the created user's ID)
    await auditService.logAction(
      req.user ? req.user._id : user._id, 
      'ACCOUNT_CREATION', 
      'User', 
      { email, role, createdUserId: user._id }, 
      req.ip
    );

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Status checks
    if (user.accountStatus !== 'ACTIVE') {
      return res.status(403).json({ message: `Account is ${user.accountStatus.toLowerCase()}` });
    }
    if (user.accountExpiresAt && new Date() > user.accountExpiresAt) {
      return res.status(403).json({ message: 'Account has expired' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  try {
    // req.user is already fetched by the protect middleware and trusted from DB
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
