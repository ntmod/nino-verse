import mongoose, { Schema, Document } from "mongoose";

export interface IDailyAverageConfig extends Document {
  selectedCategories: string[];
  updatedAt: Date;
}

const DailyAverageConfigSchema: Schema = new Schema({
  selectedCategories: { type: [String], required: true },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.DailyAverageConfig || mongoose.model<IDailyAverageConfig>("DailyAverageConfig", DailyAverageConfigSchema);
