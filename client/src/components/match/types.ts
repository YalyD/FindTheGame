export interface Driver {
  _id: string
  name: string
  picture: string
}

export interface RideOffer {
  _id: string
  driver: Driver
  origin: string
  seatsAvailable: number
}
