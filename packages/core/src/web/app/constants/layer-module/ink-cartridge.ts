export enum InkDetectionStatus {
  FAILED = 1,
  PENDING = 0, // The door was opened.
  SUCCESS = 2, // valid and used
  UNUSED = 4, // valid but not used
  VALIDATE_FAILED = 3, // Secure chip validation failed.
}

export default {};
