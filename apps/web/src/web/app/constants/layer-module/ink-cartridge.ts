export enum InkDetectionStatus {
  PENDING = 0, // The door was opened.
  FAILED = 1,
  SUCCESS = 2, // valid and used
  VALIDATE_FAILED = 3, // Secure chip validation failed.
  UNUSED = 4, // valid but not used
}

export default {};
