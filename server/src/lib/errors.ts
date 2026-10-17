// Thrown by services; errorHandler turns it into a JSON response with this status.
export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
