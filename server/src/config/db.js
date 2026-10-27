import dns from 'node:dns'
import mongoose from 'mongoose'

// Fix: some networks block SRV lookups; use public DNS
dns.setServers(['8.8.8.8', '1.1.1.1'])

export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is missing in .env')
  await mongoose.connect(uri)
  console.log('MongoDB connected:', mongoose.connection.name)
}