import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 32
  },
  passwordHash: {
    type: String,
    required: true,
    select: false
  },
  passwordPeppered: {
    type: Boolean,
    default: false,
    required: true
  },
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Admin', adminSchema);
