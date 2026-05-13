import User from "../models/User.js";
import bcrypt from "bcryptjs";


// ============================
// GET PROFILE
// ============================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// ============================
// UPDATE PROFILE
// ============================
export const updateProfile = async (req, res) => {
  try {
    const { fullName, email, oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // -------- PASSWORD CHANGE --------
    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ message: "Old password required" });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "Old password incorrect" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    // -------- EMAIL CHANGE --------
    let emailChanged = false;

    if (email && email !== user.email) {
      user.email = email;
      emailChanged = true;
    }

    // -------- NAME UPDATE --------
    if (fullName) {
      user.fullName = fullName;
    }

    // -------- MEDICAL PROFILE UPDATE --------
    if (req.body.age)        user.age        = Number(req.body.age);
    if (req.body.gender)     user.gender     = req.body.gender;
    if (req.body.bloodGroup) user.bloodGroup = req.body.bloodGroup;
    if (req.body.height)     user.height     = Number(req.body.height);

    await user.save();

    // If email changed → frontend logout karega
    res.json({
      message: "Profile updated",
      forceLogout: emailChanged
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    // 🔴 Safety check
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }
    const imagePath = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: imagePath },
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile image updated",
      profileImage: user.profileImage
    });

  } catch (error) {
    res.status(500).json({ message: "Image upload failed" });
  }
};
