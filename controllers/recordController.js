// ✅ FIX: saveLifestyle mein 'steps' save nahi ho raha tha
// Ab steps bhi properly save hota hai

import DailyRecord from "../models/DailyRecord.js";

export const saveDiseases = async (req, res) => {
  try {
    const userId = req.user.id;
    const { diseases } = req.body;

    const today = new Date().toISOString().split("T")[0];

    const record = await DailyRecord.findOneAndUpdate(
      { user: userId, date: today },
      { $set: { diseases } },
      { new: true, upsert: true }
    );

    res.json({ message: "Diseases saved", record });

  } catch (error) {
    console.error("SAVE DISEASE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const saveLifestyle = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ FIX: steps pehle missing tha — ab included hai
    const { sleep, water, exercise, steps } = req.body;

    const today = new Date().toISOString().split("T")[0];

    const record = await DailyRecord.findOneAndUpdate(
      { user: userId, date: today },
      {
        $set: {
          "lifestyle.sleep":    Number(sleep)    || 0,
          "lifestyle.water":    Number(water)    || 0,
          "lifestyle.exercise": Number(exercise) || 0,
          "lifestyle.steps":    Number(steps)    || 0   // ✅ Added
        }
      },
      { new: true, upsert: true }
    );

    res.json({ message: "Lifestyle saved", record });

  } catch (error) {
    console.error("SAVE LIFESTYLE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const saveVitals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { vitals } = req.body;

    const today = new Date().toISOString().split("T")[0];

    const record = await DailyRecord.findOneAndUpdate(
      { user: userId, date: today },
      { $set: { vitals } },
      { new: true, upsert: true }
    );

    res.json({ message: "Vitals saved", record });

  } catch (error) {
    console.error("SAVE VITAL ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserRecords = async (req, res) => {
  try {
    const userId = req.user.id;

    const records = await DailyRecord.find({ user: userId })
      .sort({ createdAt: -1 });

    res.json(records);

  } catch (error) {
    console.error("GET RECORDS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ NEW: Google Fit se auto-synced data — cron job yeh call karta hai
// Frontend se nahi, sirf internal use ke liye
export const saveFitnessData = async (userId, fitnessData) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const updateFields = {};
    if (fitnessData.steps)     updateFields["lifestyle.steps"]    = fitnessData.steps;
    if (fitnessData.heartRate) updateFields["vitals.heartRate"]   = fitnessData.heartRate;
    if (fitnessData.calories)  updateFields["vitals.calories"]    = fitnessData.calories;

    if (Object.keys(updateFields).length === 0) return;

    await DailyRecord.findOneAndUpdate(
      { user: userId, date: today },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    console.log(`✅ Fitness data saved for ${userId}`);
  } catch (err) {
    console.error("saveFitnessData error:", err.message);
  }
};
