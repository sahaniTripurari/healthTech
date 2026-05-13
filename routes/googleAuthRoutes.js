import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();

// ✅ FIX: Pehle scope pass nahi ho raha tha — isliye "Missing required parameter: scope" error tha
router.get("/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      
    ],
    accessType: "offline",
    prompt: "consent"
  })
);

// ✅ Callback: JWT token banao aur SPA mein pass karo
router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/#home" }),
  (req, res) => {
    try {
      // JWT token banao — wahi token jo baaki API calls mein use hota hai
      const token = jwt.sign(
        { id: req.user._id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // ✅ Token ko URL se SPA mein bhejo — frontend localStorage mein save karega
      res.redirect(`/?token=${token}#dashboard`);

    } catch (err) {
      console.error("Google callback error:", err.message);
      res.redirect("/#home");
    }
  }
);

export default router;