export class PseintRuntimeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PseintRuntimeError'
  }
}
