// ✅ FIX: Pehle sirf accessToken pass ho raha tha, userId nahi
// Ab userId bhi pass hota hai aur token refresh handle hota hai

import User from "../models/User.js";
import fetchGoogleFitData from "./googleFitService.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// ── Token Refresh Helper ──────────────────────────────────
async function refreshAccessToken(user) {
  try {
    if (!user.googleRefreshToken) return null;

    const res = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: user.googleRefreshToken,
      grant_type: "refresh_token"
    });

    const newAccessToken = res.data.access_token;

    // Save new token to DB
    user.googleAccessToken = newAccessToken;
    await user.save();

    console.log(`🔄 Token refreshed for user: ${user._id}`);
    return newAccessToken;

  } catch (err) {
    console.warn(`⚠️ Token refresh failed for user ${user._id}:`, err.message);
    return null;
  }
}

// ── Main Cron Function ────────────────────────────────────
function startFitnessCron() {
  console.log("🕐 Fitness Cron started — syncing every 60 seconds");

  setInterval(async () => {
    try {
      // Only users who have connected Google Fit
      const users = await User.find({
        googleAccessToken: { $exists: true, $ne: null }
      });

      if (users.length === 0) {
        console.log("ℹ️ No Google Fit users found to sync");
        return;
      }

      console.log(`🔄 Syncing fitness data for ${users.length} user(s)...`);

      for (let user of users) {
        try {
          let token = user.googleAccessToken;

          // ✅ FIX: userId bhi pass karo — pehle missing tha
          await fetchGoogleFitData(user._id, token);

        } catch (err) {
          // Token expired — try refresh
          if (err.response?.status === 401) {
            console.log(`🔄 Refreshing token for user ${user._id}`);
            const newToken = await refreshAccessToken(user);

            if (newToken) {
              try {
                await fetchGoogleFitData(user._id, newToken);
              } catch (retryErr) {
                console.error(`🔴 Retry failed for user ${user._id}:`, retryErr.message);
              }
            }
          } else {
            console.error(`🔴 Sync error for user ${user._id}:`, err.message);
          }
        }
      }

      console.log("✅ Fitness sync complete");

    } catch (err) {
      console.error("🔴 Fitness Cron Error:", err.message);
    }
  }, 60000); // 60 seconds
}

export default startFitnessCron;
