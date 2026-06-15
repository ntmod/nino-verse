const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const MONGODB_URI = process.env.MONGODB_CONNECTION_STRING;
if (!MONGODB_URI) {
  console.error("MONGODB_CONNECTION_STRING is missing in .env");
  process.exit(1);
}

// Category schema
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, required: true },
  type: { type: String, required: true },
  subcategories: [{ name: String }],
});
const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);

// Payment Method schema
const PaymentMethodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
});
const PaymentMethod = mongoose.models.PaymentMethod || mongoose.model("PaymentMethod", PaymentMethodSchema);

// Transaction schema
const TransactionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: false },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  paymentMethod: { type: String, required: true },
});
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: "nino-verse" });
    console.log("Connected to database successfully!");

    const categories = await Category.find({});
    console.log(`Found ${categories.length} categories.`);

    const paymentMethods = await PaymentMethod.find({});
    console.log(`Found ${paymentMethods.length} payment methods.`);

    const transactions = await Transaction.find({});
    console.log(`Found ${transactions.length} transactions to check.`);

    let updatedCatCount = 0;
    let updatedPayCount = 0;
    
    for (const tx of transactions) {
      let changed = false;
      
      // Migrate category
      const categoryVal = tx.category;
      const matchesCatId = categories.find(c => c._id.toString() === categoryVal);
      if (!matchesCatId) {
        const matchingCat = categories.find(c => {
          const catNameLower = c.name.toLowerCase();
          const categoryValLower = categoryVal.toLowerCase();
          return categoryValLower === catNameLower || 
                 categoryValLower.endsWith(catNameLower) ||
                 categoryValLower.includes(catNameLower);
        });
        if (matchingCat) {
          tx.category = matchingCat._id.toString();
          console.log(`Migrated category for "${tx.name}": "${categoryVal}" -> ID "${matchingCat._id}"`);
          changed = true;
          updatedCatCount++;
        } else {
          console.warn(`Could not find a category matching "${categoryVal}" for transaction "${tx.name}"`);
        }
      }

      // Migrate paymentMethod
      const paymentVal = tx.paymentMethod;
      const matchesPayId = paymentMethods.find(p => p._id.toString() === paymentVal);
      if (!matchesPayId && paymentVal) {
        const matchingPay = paymentMethods.find(p => {
          const payNameLower = p.name.toLowerCase();
          const paymentValLower = paymentVal.toLowerCase();
          return paymentValLower === payNameLower ||
                 paymentValLower.endsWith(payNameLower) ||
                 paymentValLower.includes(payNameLower);
        });
        if (matchingPay) {
          tx.paymentMethod = matchingPay._id.toString();
          console.log(`Migrated payment method for "${tx.name}": "${paymentVal}" -> ID "${matchingPay._id}"`);
          changed = true;
          updatedPayCount++;
        } else {
          console.warn(`Could not find a payment method matching "${paymentVal}" for transaction "${tx.name}"`);
        }
      }

      if (changed) {
        await tx.save();
      }
    }

    console.log(`Migration complete! Updated ${updatedCatCount} categories, and ${updatedPayCount} payment methods.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
