import mongoose from "mongoose";

const dailyRecordSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  date: {
    type: String,
    required: true
  },

  diseases: [{
    type: String
  }],

  lifestyle: {
    sleep: {
      type: Number,
      default: 0
    },
    water: {
      type: Number,
      default: 0
    },
    exercise: {
      type: Number,
      default: 0
    },
    steps: {
      type: Number,
      default: 0
    }

  },
  vitals: {
  type: Object,
  default: {}
}

}, { timestamps: true });


// 🔥 Important: One record per user per day
dailyRecordSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyRecord", dailyRecordSchema);