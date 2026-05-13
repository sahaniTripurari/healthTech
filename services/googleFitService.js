import DailyRecord from "../models/DailyRecord.js";

function generateMockFitnessData() {
  return {
    steps:     Math.floor(Math.random() * 8000) + 2000,
    heartRate: Math.floor(Math.random() * 40)  + 60,
    calories:  Math.floor(Math.random() * 500) + 200,
  };
}

async function fetchGoogleFitData(userId, accessToken) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const data  = generateMockFitnessData();

    await DailyRecord.findOneAndUpdate(
      { user: userId, date: today },
      {
        $set: {
          "lifestyle.steps":       data.steps,
          "vitals.heartRate":      data.heartRate,
          "vitals.calories":       data.calories,
          "vitals.lastSyncedFrom": "device",
          "vitals.lastSyncedAt":   new Date().toISOString()
        }
      },
      { new: true, upsert: true }
    );

    console.log(`✅ Device data synced | Steps: ${data.steps} | HR: ${data.heartRate} bpm | Cal: ${data.calories}`);
    return data;

  } catch (err) {
    console.error("Fitness Sync Error:", err.message);
    throw err;
  }
}

export default fetchGoogleFitData;
