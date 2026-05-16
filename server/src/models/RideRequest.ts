import mongoose, { Schema, Document } from 'mongoose'

export type RideRequestStatus = 'open' | 'matched' | 'cancelled'

export interface IRideRequest extends Document {
  game: mongoose.Types.ObjectId
  passenger: mongoose.Types.ObjectId
  origin: string
  seatsNeeded: number
  status: RideRequestStatus
  matchedOffer?: mongoose.Types.ObjectId
  createdAt: Date
}

const rideRequestSchema = new Schema<IRideRequest>(
  {
    game: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
    passenger: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    origin: { type: String, required: true },
    seatsNeeded: { type: Number, required: true, min: 1, max: 6 },
    status: { type: String, enum: ['open', 'matched', 'cancelled'], default: 'open' },
    matchedOffer: { type: Schema.Types.ObjectId, ref: 'RideOffer' },
  },
  { timestamps: true },
)

export const RideRequest = mongoose.model<IRideRequest>('RideRequest', rideRequestSchema)
