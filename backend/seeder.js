// backend/seeder.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Resource from './models/resourceModel.js';
import User from './models/userModel.js'; // Keep this to prevent potential errors
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

const importData = async (filePath) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, filePath), 'utf-8'));
    
    await Resource.insertMany(data);

    console.log('Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error importing data: ${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Resource.deleteMany();
    
    console.log('Data Destroyed Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error destroying data: ${error}`);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  
  if (process.argv[2] === '-d') {
    await destroyData();
  } else if (process.argv[2]) {
    await importData(process.argv[2]);
  } else {
    console.log('Please specify a JSON file to import, e.g., node seeder.js data/placements.json');
    process.exit(1);
  }
};

run();