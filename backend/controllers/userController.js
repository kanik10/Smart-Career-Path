import User from '../models/userModel.js';
import Resource from '../models/resourceModel.js';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import nodemailer from 'nodemailer';

const ADMIN_OTP_EXPIRY_MS = 5 * 60 * 1000;
const adminOtpStore = new Map();
const isProduction = process.env.NODE_ENV === 'production';

const hasSmtpConfig = () => {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

const hasResendConfig = () => {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
};

const normalizeEmail = (value = '') => value.trim().toLowerCase();

const isMatchingEnvAdminCredentials = (email, password) => {
  const envAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL || '');
  const envAdminPassword = process.env.ADMIN_PASSWORD || '';

  if (!envAdminEmail || !envAdminPassword) {
    return false;
  }

  return normalizeEmail(email) === envAdminEmail && password === envAdminPassword;
};

const generateOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const toCertificateMeta = (certificate) => ({
  courseId: certificate.courseId,
  courseTitle: certificate.courseTitle || '',
  fileName: certificate.fileName,
  fileSize: certificate.fileSize,
  uploadedAt: certificate.uploadedAt,
  viewUrl: `/api/users/courses/certificate/${certificate.courseId}`,
});

const normalizeCareerPath = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (['placements', 'higher-studies', 'entrepreneurship'].includes(normalized)) {
    return normalized;
  }
  return null;
};

const ensureEnvAdminUserExists = async () => {
  const envAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL || '');
  const envAdminPassword = process.env.ADMIN_PASSWORD || '';

  if (!envAdminEmail || !envAdminPassword) {
    throw new Error('ADMIN_EMAIL or ADMIN_PASSWORD is missing in environment variables');
  }

  let adminUser = await User.findOne({ email: envAdminEmail });

  if (!adminUser) {
    adminUser = await User.create({
      name: process.env.ADMIN_NAME || 'System Admin',
      email: envAdminEmail,
      password: envAdminPassword,
      department: process.env.ADMIN_DEPARTMENT || 'Administration',
      semester: process.env.ADMIN_SEMESTER || 'N/A',
      dateOfBirth: process.env.ADMIN_DOB || '1990-01-01',
      isAdmin: true,
    });
  } else if (!adminUser.isAdmin) {
    adminUser.isAdmin = true;
    await adminUser.save();
  }

  return adminUser;
};

const sendOtpBySmtp = async (toEmail, otp) => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !from) {
    throw new Error('SMTP configuration is incomplete in environment variables');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: 'Smart Career Path Admin OTP',
    text: `Your Smart Career Path admin OTP is ${otp}. It expires in 5 minutes.`,
    html: `<p>Your Smart Career Path admin OTP is <strong>${otp}</strong>.</p><p>It expires in 5 minutes.</p>`,
  });
};

const resendOtpByApi = async (toEmail, otp) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY or RESEND_FROM is missing in environment variables');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      subject: 'Smart Career Path Admin OTP (Resend)',
      html: `<p>Your Smart Career Path admin OTP is <strong>${otp}</strong>.</p><p>It expires in 5 minutes.</p>`,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API failed: ${response.status} ${errorBody}`);
  }
};

const deliverOtp = async (toEmail, otp, preferredProvider = 'smtp') => {
  const attempts = [];

  if (preferredProvider === 'smtp') {
    if (hasSmtpConfig()) attempts.push({ provider: 'smtp', fn: sendOtpBySmtp });
    if (hasResendConfig()) attempts.push({ provider: 'resend', fn: resendOtpByApi });
  } else {
    if (hasResendConfig()) attempts.push({ provider: 'resend', fn: resendOtpByApi });
    if (hasSmtpConfig()) attempts.push({ provider: 'smtp', fn: sendOtpBySmtp });
  }

  if (!attempts.length) {
    throw new Error('No email provider configured. Add Resend keys or SMTP credentials in backend/.env');
  }

  const errors = [];
  for (const attempt of attempts) {
    try {
      await attempt.fn(toEmail, otp);
      return attempt.provider;
    } catch (error) {
      errors.push(`${attempt.provider}: ${error.message}`);
    }
  }

  throw new Error(`Failed to deliver OTP. ${errors.join(' | ')}`);
};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, department, semester, dateOfBirth } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }
  const user = await User.create({
    name, email, password, department, semester, dateOfBirth
  });
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      profileImage: user.profileImage || '',
      careerPath: user.careerPath || null,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Auth user & get token (UPDATED WITH STATUS CHECK)
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (user.status === 'inactive') {
      res.status(403); // 403 Forbidden
      throw new Error('Your account has been deactivated. Please contact an administrator.');
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      profileImage: user.profileImage || '',
      careerPath: user.careerPath || null,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Update user's career path
export const updateUserCareerPath = asyncHandler(async (req, res) => {
  // This should be protected, getting user from token
    const user = await User.findById(req.user._id); 
  if (user) {
    user.careerPath = req.body.careerPath;
    user.subDomain = null;
    user.subDomainReason = null;
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      careerPath: updatedUser.careerPath,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// @desc    Update user's allocated sub-domain
// @route   PUT /api/users/subdomain
// @access  Private
export const updateUserSubDomain = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const nextSubDomain = req.body.subDomain;
  const nextSubDomainReason = req.body.subDomainReason;

  if (nextSubDomain === null || nextSubDomain === '') {
    user.subDomain = null;
    user.subDomainReason = null;
  } else {
    user.subDomain = String(nextSubDomain).trim();
    user.subDomainReason = nextSubDomainReason
      ? String(nextSubDomainReason).trim()
      : null;
  }

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    careerPath: updatedUser.careerPath,
    subDomain: updatedUser.subDomain,
    subDomainReason: updatedUser.subDomainReason,
  });
});


// @desc    Get user profile
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      semester: user.semester,
      dateOfBirth: user.dateOfBirth,
      careerPath: user.careerPath,
      subDomain: user.subDomain || null,
      subDomainReason: user.subDomainReason || null,
      profileImage: user.profileImage,
      skills: user.skills,
      workExperience: user.workExperience,
      certifications: user.certifications,
      linkedinUrl: user.linkedinUrl,
      githubUrl: user.githubUrl,
      portfolioUrl: user.portfolioUrl,
      enrolledCourses: user.enrolledCourses,
      completedCourses: user.completedCourses,
      courseCertificates: (user.courseCertificates || []).map(toCertificateMeta),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const normalizedCareerPath = normalizeCareerPath(req.body.careerPath);
    if (req.body.careerPath === null) {
      user.careerPath = null;
    } else if (req.body.careerPath !== undefined && normalizedCareerPath) {
      user.careerPath = normalizedCareerPath;
    }

    if (req.body.subDomain === null || req.body.subDomain === '') {
      user.subDomain = null;
      user.subDomainReason = null;
    } else if (req.body.subDomain !== undefined) {
      user.subDomain = String(req.body.subDomain).trim();
      if (req.body.subDomainReason !== undefined) {
        user.subDomainReason = req.body.subDomainReason
          ? String(req.body.subDomainReason).trim()
          : null;
      }
    }

    user.skills = req.body.skills ?? user.skills;
    user.workExperience = req.body.workExperience ?? user.workExperience;
    user.certifications = req.body.certifications ?? user.certifications;
    user.linkedinUrl = req.body.linkedinUrl ?? user.linkedinUrl;
    user.githubUrl = req.body.githubUrl ?? user.githubUrl;
    user.portfolioUrl = req.body.portfolioUrl ?? user.portfolioUrl;
    user.profileImage = req.body.profileImage ?? user.profileImage;
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      department: updatedUser.department,
      semester: updatedUser.semester,
      dateOfBirth: updatedUser.dateOfBirth,
      careerPath: updatedUser.careerPath,
      subDomain: updatedUser.subDomain || null,
      subDomainReason: updatedUser.subDomainReason || null,
      profileImage: updatedUser.profileImage,
      skills: updatedUser.skills,
      workExperience: updatedUser.workExperience,
      certifications: updatedUser.certifications,
      linkedinUrl: updatedUser.linkedinUrl,
      githubUrl: updatedUser.githubUrl,
      portfolioUrl: updatedUser.portfolioUrl,
      enrolledCourses: updatedUser.enrolledCourses,
      completedCourses: updatedUser.completedCourses,
      courseCertificates: (updatedUser.courseCertificates || []).map(toCertificateMeta),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Create a new admin user
export const createAdminUser = asyncHandler(async (req, res) => {
  const { name, email, password, department, semester, dateOfBirth } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }
  const user = await User.create({
    name, email, password, department, semester, dateOfBirth, isAdmin: true
  });
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Enroll user in a course
export const enrollInCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const user = await User.findById(req.user._id);
  if (user) {
    if (!user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses.push(courseId);
      await user.save();
    }
    res.json({ message: 'Enrolled successfully', enrolledCourses: user.enrolledCourses });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Drop a course
export const dropCourse = asyncHandler(async (req, res) => {
  const courseId = req.params.id;
  const user = await User.findById(req.user._id);
  if (user) {
    user.enrolledCourses = user.enrolledCourses.filter(id => id.toString() !== courseId);
    user.courseCertificates = (user.courseCertificates || []).filter(
      (certificate) => certificate.courseId.toString() !== courseId
    );
    await user.save();
    res.json({ message: 'Course dropped', enrolledCourses: user.enrolledCourses });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Mark a course as completed
export const completeCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const user = await User.findById(req.user._id);
  if (user) {
    const hasCertificate = (user.courseCertificates || []).some(
      (certificate) => certificate.courseId.toString() === courseId
    );

    if (!hasCertificate) {
      res.status(400);
      throw new Error('Please upload the completion certificate PDF before marking this course as completed');
    }

    user.enrolledCourses = user.enrolledCourses.filter(id => id.toString() !== courseId);
    if (!user.completedCourses.includes(courseId)) {
      user.completedCourses.push(courseId);
    }
    await user.save();
    res.json({ 
      message: 'Course completed',
      enrolledCourses: user.enrolledCourses,
      completedCourses: user.completedCourses,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Upload course completion certificate (PDF up to 5MB)
// @route   POST /api/users/courses/certificate
// @access  Private
export const uploadCourseCertificate = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const file = req.file;

  if (!courseId) {
    res.status(400);
    throw new Error('courseId is required');
  }

  if (!file) {
    res.status(400);
    throw new Error('Certificate PDF file is required');
  }

  if (file.mimetype !== 'application/pdf') {
    res.status(400);
    throw new Error('Only PDF files are allowed');
  }

  if (file.size > 5 * 1024 * 1024) {
    res.status(400);
    throw new Error('File size must be 5MB or less');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isEnrolled = (user.enrolledCourses || []).some((id) => id.toString() === courseId);
  if (!isEnrolled) {
    res.status(400);
    throw new Error('You can only upload certificates for enrolled courses');
  }

  const course = await Resource.findById(courseId).select('title');
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const certificateEntry = {
    courseId,
    courseTitle: course.title || 'Course',
    fileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    fileData: file.buffer,
    uploadedAt: new Date(),
  };

  const existingIndex = (user.courseCertificates || []).findIndex(
    (certificate) => certificate.courseId.toString() === courseId
  );

  if (existingIndex >= 0) {
    user.courseCertificates[existingIndex] = certificateEntry;
  } else {
    user.courseCertificates.push(certificateEntry);
  }

  await user.save();

  const saved = (user.courseCertificates || []).find(
    (certificate) => certificate.courseId.toString() === courseId
  );

  res.json({
    message: 'Certificate uploaded successfully',
    certificate: saved ? toCertificateMeta(saved) : null,
  });
});

// @desc    View uploaded certificate PDF for a course
// @route   GET /api/users/courses/certificate/:courseId
// @access  Private
export const getCourseCertificate = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const certificate = (user.courseCertificates || []).find(
    (item) => item.courseId.toString() === courseId
  );

  if (!certificate || !certificate.fileData) {
    res.status(404);
    throw new Error('Certificate not found for this course');
  }

  res.setHeader('Content-Type', certificate.mimeType || 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${certificate.fileName || 'certificate.pdf'}"`);
  res.send(certificate.fileData);
});

// @desc    Request OTP for env-based admin login (SMTP)
// @route   POST /api/users/admin/login/request-otp
// @access  Public
export const requestAdminOtp = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Admin email and password are required');
  }

  if (!isMatchingEnvAdminCredentials(email, password)) {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }

  await ensureEnvAdminUserExists();

  const normalizedEmail = normalizeEmail(email);
  const otp = generateOtp();
  adminOtpStore.set(normalizedEmail, {
    otp,
    expiresAt: Date.now() + ADMIN_OTP_EXPIRY_MS,
  });

  let deliveryProvider = 'smtp';
  try {
    deliveryProvider = await deliverOtp(normalizedEmail, otp, 'smtp');
  } catch (deliveryError) {
    if (isProduction) {
      throw deliveryError;
    }

    deliveryProvider = 'dev-fallback';
  }

  const response = {
    message: `OTP sent to admin email via ${deliveryProvider}`,
    expiresInSeconds: Math.floor(ADMIN_OTP_EXPIRY_MS / 1000),
  };

  if (!isProduction && deliveryProvider === 'dev-fallback') {
    response.devOtp = otp;
    response.message = 'Email delivery failed. Using development fallback OTP from API response.';
  }

  res.json(response);
});

// @desc    Resend admin OTP using Resend API
// @route   POST /api/users/admin/login/resend-otp
// @access  Public
export const resendAdminOtp = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Admin email and password are required');
  }

  if (!isMatchingEnvAdminCredentials(email, password)) {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }

  const normalizedEmail = normalizeEmail(email);
  const otp = generateOtp();
  adminOtpStore.set(normalizedEmail, {
    otp,
    expiresAt: Date.now() + ADMIN_OTP_EXPIRY_MS,
  });

  let deliveryProvider = 'resend';
  try {
    deliveryProvider = await deliverOtp(normalizedEmail, otp, 'resend');
  } catch (deliveryError) {
    if (isProduction) {
      throw deliveryError;
    }

    deliveryProvider = 'dev-fallback';
  }

  const response = {
    message: `OTP resent to admin email via ${deliveryProvider}`,
    expiresInSeconds: Math.floor(ADMIN_OTP_EXPIRY_MS / 1000),
  };

  if (!isProduction && deliveryProvider === 'dev-fallback') {
    response.devOtp = otp;
    response.message = 'Email delivery failed. Using development fallback OTP from API response.';
  }

  res.json(response);
});

// @desc    Verify OTP and login env-based admin
// @route   POST /api/users/admin/login/verify-otp
// @access  Public
export const verifyAdminOtp = asyncHandler(async (req, res) => {
  const { email, password, otp } = req.body;

  if (!email || !password || !otp) {
    res.status(400);
    throw new Error('Admin email, password and OTP are required');
  }

  if (!isMatchingEnvAdminCredentials(email, password)) {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }

  const normalizedEmail = normalizeEmail(email);
  const otpRecord = adminOtpStore.get(normalizedEmail);

  if (!otpRecord) {
    res.status(400);
    throw new Error('No OTP requested for this admin email');
  }

  if (Date.now() > otpRecord.expiresAt) {
    adminOtpStore.delete(normalizedEmail);
    res.status(400);
    throw new Error('OTP has expired. Please request a new OTP');
  }

  if (`${otp}` !== `${otpRecord.otp}`) {
    res.status(401);
    throw new Error('Invalid OTP');
  }

  adminOtpStore.delete(normalizedEmail);

  const adminUser = await ensureEnvAdminUserExists();

  res.json({
    _id: adminUser._id,
    name: adminUser.name,
    email: adminUser.email,
    isAdmin: adminUser.isAdmin,
    profileImage: adminUser.profileImage || '',
    token: generateToken(adminUser._id),
  });
});