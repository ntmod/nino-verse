import mongoose, { Schema } from 'mongoose';

const CycleSettingsSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  mode: { type: String, enum: ['fixed', 'manual'], default: 'fixed' },
  starts: { type: [Date], default: [] },
  ids: { type: [String], default: [] },
  fixedDay: { type: Number, min: 1, max: 31, default: 30 },
  automaticFrom: { type: Date, default: null },
  revision: { type: Number, default: 0 },
}, { timestamps: true });
for (const key of ['fixedDay', 'automaticFrom'] as const) {
  if (mongoose.models.CycleSettings && !mongoose.models.CycleSettings.schema.path(key)) {
    mongoose.models.CycleSettings.schema.add({ [key]: CycleSettingsSchema.obj[key] });
  }
}
export default mongoose.models.CycleSettings || mongoose.model('CycleSettings', CycleSettingsSchema);
