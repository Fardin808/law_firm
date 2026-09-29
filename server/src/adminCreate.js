import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({
    email: "admin@lawfirm.com",
  });

  if(existing){
    console.log("Admin already exists");
    process.exit();
  }

  const hashedPassword = await bcrypt.hash(
    "@dmin123",
    10
  );

  await User.create({
    name: "Admin",
    email: "admin@lawfirm.com",
    password: hashedPassword,
    role: "admin",
    isActive: true,
  });

  console.log("Admin created successfully");

  process.exit();
};

createAdmin();