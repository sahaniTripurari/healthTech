import bcrypt from "bcryptjs";
import User   from "../models/User.js";

// ─────────────────────────────────────────────
//  GET  /api/auth/me   →   apna profile laao
// ─────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────
//  PUT  /api/user/profile   →   profile update
//  Body: { fullName, email, oldPassword?, newPassword? }
// ─────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { fullName, email, oldPassword, newPassword } = req.body;

    // 1. User fetch karo (password bhi chahiye comparison ke liye)
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Basic fields update karo
    if (fullName) user.fullName = fullName.trim();
    if (email)    user.email    = email.trim().toLowerCase();

    // 3. Password change — sirf tab jab dono fields aaye
    let forceLogout = false;

    if (oldPassword || newPassword) {
      // Dono fields required hain
      if (!oldPassword) {
        return res.status(400).json({ message: "Purana password daalo." });
      }
      if (!newPassword) {
        return res.status(400).json({ message: "Naya password daalo." });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Naya password kam se kam 6 characters ka hona chahiye." });
      }

      // Old password verify karo
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Old password galat hai." });
      }

      // Hash karke save karo
      user.password = await bcrypt.hash(newPassword, 10);
      forceLogout   = true; // password change hone ke baad re-login karwao
    }

    // 4. Save karo
    await user.save();

    // 5. Response bhejo (password field nahi)
    res.json({
      message:     "Profile updated successfully!",
      forceLogout,                          // frontend isko dekh ke logout karega
      user: {
        _id:          user._id,
        fullName:     user.fullName,
        email:        user.email,
        profileImage: user.profileImage,
        createdAt:    user.createdAt,
      }
    });

  } catch (err) {
    console.error("updateProfile error:", err);

    // Duplicate email (MongoDB unique index)
    if (err.code === 11000) {
      return res.status(400).json({ message: "Yeh email pehle se registered hai." });
    }

    res.status(500).json({ message: "Server error" });
  }
};
