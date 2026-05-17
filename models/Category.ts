import mongoose, { Schema, Document } from "mongoose";

export interface ISubcategory {
  _id?: string;
  name: string;
}

export interface ICategory extends Document {
  name: string;
  icon: string;
  type: "income" | "expense";
  subcategories: ISubcategory[];
  createdAt: Date;
}

const CategorySchema: Schema = new Schema({
  name: { type: String, required: true },
  icon: { type: String, required: true },
  type: { type: String, enum: ["income", "expense"], default: "expense" },
  subcategories: [{
    name: { type: String, required: true }
  }],
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
