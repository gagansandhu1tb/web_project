#!/usr/bin/env node
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userModulePath = path.join(__dirname, '../server/models/User.js');
const User = (await import(pathToFileURL(userModulePath).href)).default;

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in environment. Set it in .env before running this script.');
  process.exit(1);
}

const [,, emailArg, passwordArg, nameArg = 'Admin User'] = process.argv;
if (!emailArg || !passwordArg) {
  console.error('Usage: node scripts/createAdmin.js <email> <password> [name]');
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    const email = emailArg.trim().toLowerCase();
    const passwordHash = bcrypt.hashSync(passwordArg, 10);

    const existing = await User.findOne({ email });
    if (existing) {
      existing.name = nameArg;
      existing.passwordHash = passwordHash;
      existing.role = 'admin';
      await existing.save();
      console.log(`Updated existing user to admin: ${email}`);
    } else {
      await User.create({ name: nameArg, email, passwordHash, role: 'admin' });
      console.log(`Created new admin user: ${email}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Failed to create/update admin user:', err);
    process.exit(1);
  }
};

run();
