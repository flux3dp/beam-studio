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
            tsConfig: "src/web/tsconfig.json"
        }
    },
    setupFilesAfterEnv: ["./src/web/setupTests.ts"],
    moduleDirectories: ["node_modules", "src/web"]
}
