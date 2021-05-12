module.exports = {
  runner: "jest-electron/runner",
  testEnvironment: "jest-electron/environment",
  preset: "ts-jest",
  testMatch: [
    "**/?(*.)+(spec|test).(ts|tsx)"
  ],
  collectCoverageFrom: [
    "src/web/**/*.(ts|tsx)"
  ],
  globals: {
    "ts-jest": {
      tsConfig: "src/tsconfig.json"
    }
  },
  setupFilesAfterEnv: ["./src/web/setupTests.ts"],
  moduleDirectories: ["node_modules", "src/web"],
  coverageReporters: ["text-summary", "html"]
}
