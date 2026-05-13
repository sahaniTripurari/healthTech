// ✅ FIX: Google se login karne wale users ka password required tha — ab nahi
// Schema fix ke saath yeh properly kaam karega

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  "http://localhost:5000/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        // Check karo — same email se normal account bana hua toh nahi?
        let user = await User.findOne({ googleId: profile.id });

        if (!user && email) {
          // Same email se pehle se account ho sakta hai
          user = await User.findOne({ email });
        }

        if (!user) {
          // ✅ Naya Google user — password empty string (schema mein default hai)
          user = await User.create({
            fullName:           profile.displayName || "User",
            email:              email || `google_${profile.id}@noemail.com`,
            password:           "", // Google users ke liye blank
            googleId:           profile.id,
            googleAccessToken:  accessToken,
            googleRefreshToken: refreshToken || null,
            profileImage:       profile.photos?.[0]?.value || ""
          });

          console.log(`✅ New Google user created: ${user.email}`);
        } else {
          // Existing user — tokens update karo
          user.googleId           = profile.id;
          user.googleAccessToken  = accessToken;
          if (refreshToken) user.googleRefreshToken = refreshToken;
          await user.save();

          console.log(`🔄 Google tokens updated for: ${user.email}`);
        }

        return done(null, user);

      } catch (err) {
        console.error("🔴 Google Strategy Error:", err.message);
        return done(err, null);
      }
    }
  )
);
