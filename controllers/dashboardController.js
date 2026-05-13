import DailyRecord from "../models/DailyRecord.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import axios from "axios";

// 🔥 Google Fit Fetch Function
const fetchGoogleFitData = async (accessToken) => {
  try {
    const response = await axios.post(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        aggregateBy: [
          { dataTypeName: "com.google.step_count.delta" },
          { dataTypeName: "com.google.heart_rate.bpm" }
        ],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: Date.now() - 86400000,
        endTimeMillis: Date.now()
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error("Google Fit Fetch Error:", error.response?.data || error.message);
    return null;
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Validate ObjectId
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // 1️⃣ Get User Profile
    const profile = await User.findById(userObjectId).select("-password");
    if (!profile) return res.status(404).json({ message: "User not found" });

    // 2️⃣ 🔥 Fetch Latest Google Fit Data (if connected)
    if (profile.googleAccessToken) {

      const fitnessData = await fetchGoogleFitData(profile.googleAccessToken);

      if (fitnessData?.bucket?.length) {

        let steps = 0;
        let heartRate = 0;

        fitnessData.bucket.forEach(bucket => {
          bucket.dataset.forEach(dataset => {
            dataset.point.forEach(point => {

              if (point.dataTypeName === "com.google.step_count.delta") {
                steps += point.value[0]?.intVal || 0;
              }

              if (point.dataTypeName === "com.google.heart_rate.bpm") {
                heartRate = point.value[0]?.fpVal || 0;
              }

            });
          });
        });

        const today = new Date().toISOString().split("T")[0];

        // 3️⃣ Save / Update Today Record
        await DailyRecord.findOneAndUpdate(
          { user: userObjectId, date: today },
          {
            $set: {
              "lifestyle.steps": steps,
              "vitals.heartRate": heartRate
            }
          },
          { upsert: true, new: true }
        );
      }
    }

    // 4️⃣ Get All Records
    const records = await DailyRecord.find({ user: userObjectId }).sort({ date: 1 });

    if (!records.length) {
      return res.json({
        profile,
        totalRecords: 0,
        records: [],
        calendarDates: [],
        vitalTrends: {},
        lifestyleTrends: {},
      });
    }

    // 5️⃣ Calendar Dates
    const calendarDates = records.map(r => r.date);

    // 6️⃣ Vital Trends
    const vitalTrends = {};
    records.forEach(r => {
      Object.entries(r.vitals || {}).forEach(([key, val]) => {
        if (!vitalTrends[key]) vitalTrends[key] = [];
        vitalTrends[key].push({ date: r.date, value: parseFloat(val) || 0 });
      });
    });

    // 7️⃣ Lifestyle Trends
    const lifestyleTrends = {
      sleep:    records.map(r => ({ date: r.date, value: r.lifestyle?.sleep    || 0 })),
      water:    records.map(r => ({ date: r.date, value: r.lifestyle?.water    || 0 })),
      exercise: records.map(r => ({ date: r.date, value: r.lifestyle?.exercise || 0 })),
      steps:    records.map(r => ({ date: r.date, value: r.lifestyle?.steps    || 0 })),
    };

    res.json({
      profile,
      totalRecords: records.length,
      records,
      calendarDates,
      vitalTrends,
      lifestyleTrends,
    });

  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};