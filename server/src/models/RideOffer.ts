import mongoose, { Schema, Document } from 'mongoose'

export type RideOfferStatus = 'open' | 'full' | 'cancelled'

export interface IRideOffer extends Document {
  game: mongoose.Types.ObjectId
  driver: mongoose.Types.ObjectId
  origin: string
  seatsAvailable: number
  passengers: mongoose.Types.ObjectId[]
  status: RideOfferStatus
  createdAt: Date
}

const rideOfferSchema = new Schema<IRideOffer>(
  {
    game: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
    driver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    origin: { type: String, required: true },
    seatsAvailable: { type: Number, required: true, min: 0, max: 6 },
    passengers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['open', 'full', 'cancelled'], default: 'open' },
  },
  { timestamps: true },
)

export const RideOffer = mongoose.model<IRideOffer>('RideOffer', rideOfferSchema)
