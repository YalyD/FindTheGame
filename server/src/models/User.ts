import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  googleId: string
  email: string
  name: string
  picture: string
  favoriteTeam?: string
  address?: string
  car?: {
    make: string
    model: string
    year: number
    seats: number
  }
}

const userSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    picture: { type: String, default: '' },
    favoriteTeam: { type: String },
    address: { type: String },
    car: {
      make: { type: String },
      model: { type: String },
      year: { type: Number },
      seats: { type: Number },
    },
  },
  { timestamps: true },
)

export const User = mongoose.model<IUser>('User', userSchema)
