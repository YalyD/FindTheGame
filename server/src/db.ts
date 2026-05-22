import mongoose from 'mongoose'
import { env } from './lib/env.js'

export async function connectDb() {
  await mongoose.connect(env().MONGODB_URI)
  console.log('Connected to MongoDB')
}

const readyStateMap: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
}

export function dbStatus(): string {
  return readyStateMap[mongoose.connection.readyState] ?? 'unknown'
}
