import mongoose, { Schema, Document } from "mongoose";

export interface ISubcategory {
  _id?: string;
  name: string;
}

export interface ICategory extends Document {
  userId?: string;
  name: string;
  icon: string;
  type: "income" | "expense";
  defaultWalletId?: string;
  subcategories: ISubcategory[];
  createdAt: Date;
}

const CategorySchema: Schema = new Schema({
  userId: { type: String, index: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  type: { type: String, enum: ["income", "expense"], default: "expense" },
  defaultWalletId: { type: String, default: '' },
  subcategories: [{
    name: { type: String, required: true }
  }],
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.Category && !mongoose.models.Category.schema.path("userId")) {
  mongoose.models.Category.schema.add({ userId: { type: String, index: true } });
}

if (mongoose.models.Category && !mongoose.models.Category.schema.path('defaultWalletId')) mongoose.models.Category.schema.add({ defaultWalletId: { type: String, default: '' } });

export default mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
