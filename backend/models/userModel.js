import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String, required: true },
  semester: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  isAdmin: { type: Boolean, default: false },
  
  status: { type: String, default: 'active', enum: ['active', 'inactive'] },
  
  careerPath: { type: String, default: null },
  subDomain: { type: String, default: null },
  subDomainReason: { type: String, default: null },
  profileImage: { type: String, default: '' },
  skills: { type: [String], default: [] },
  workExperience: { type: [String], default: [] },
  certifications: { type: [String], default: [] },
  linkedinUrl: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  portfolioUrl: { type: String, default: '' },
   completedMilestones: { type: [String], default: [] },
  resumeUrl: { type: String, default: '' },
   enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }],
  completedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }],
  courseCertificates: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
    courseTitle: { type: String, default: '' },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileData: { type: Buffer, required: true },
    uploadedAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});



userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

// THIS LINE BELONGS HERE
export default User;