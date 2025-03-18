export class SuperCarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SuperCarError';
  }
}

export class BothServicesDownError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BothServicesDownError';
  }
}
