import mongoose, { Schema, Document } from 'mongoose'

export interface IGame extends Document {
  homeTeam: string
  awayTeam: string
  date: Date
  stadium: string
  city: string
  competition: string
}

const gameSchema = new Schema<IGame>({
  homeTeam: { type: String, required: true },
  awayTeam: { type: String, required: true },
  date: { type: Date, required: true },
  stadium: { type: String, required: true },
  city: { type: String, required: true },
  competition: { type: String, required: true },
})

export const Game = mongoose.model<IGame>('Game', gameSchema)
