import mongoose, { Schema, Document } from "mongoose";

export interface IDailyAverageConfig extends Document {
  userId?: string;
  selectedCategories: string[];
  updatedAt: Date;
}

const DailyAverageConfigSchema: Schema = new Schema({
  userId: { type: String, index: true },
  selectedCategories: { type: [String], required: true },
  updatedAt: { type: Date, default: Date.now },
});

if (mongoose.models.DailyAverageConfig && !mongoose.models.DailyAverageConfig.schema.path("userId")) {
  mongoose.models.DailyAverageConfig.schema.add({ userId: { type: String, index: true } });
}

export default mongoose.models.DailyAverageConfig || mongoose.model<IDailyAverageConfig>("DailyAverageConfig", DailyAverageConfigSchema);
