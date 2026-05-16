import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId
  message: string
  read: boolean
  relatedOffer?: mongoose.Types.ObjectId
  createdAt: Date
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedOffer: { type: Schema.Types.ObjectId, ref: 'RideOffer' },
  },
  { timestamps: true },
)

export const Notification = mongoose.model<INotification>('Notification', notificationSchema)
