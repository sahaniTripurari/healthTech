import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    // ✅ Not required — Google login users don't have password
    default: ""
  },

  profileImage: {
    type: String,
    default: ""
  },

  // ✅ FIX: googleId field ADD kiya — pehle missing tha
  // googleStrategy.js mein googleId save ho raha tha but schema mein field nahi tha
  googleId: {
    type: String,
    default: null
  },

  googleAccessToken: {
    type: String,
    default: null
  },

  googleRefreshToken: {
    type: String,
    default: null
  },

  resetOTP: String,
  resetOTPExpire: Date,

  // Medical Profile Fields
  age: { type: Number, default: null },
  gender: { type: String, default: "" },
  bloodGroup: { type: String, default: "" },
  height: { type: Number, default: null }

}, { timestamps: true });


// Virtual: Display UID
userSchema.virtual("uid").get(function () {
  return "UID-" + this._id.toString().slice(-8).toUpperCase();
});

// Hide sensitive fields
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.resetOTP;
  delete user.resetOTPExpire;
  delete user.googleAccessToken;
  delete user.googleRefreshToken;
  return user;
};

export default mongoose.model("User", userSchema);
