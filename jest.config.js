module.exports = {
    runner: "jest-electron/runner",
    testEnvironment: "jest-electron/environment",
    preset: "ts-jest",
    testMatch: [
        "**/?(*.)+(spec|test).(ts|tsx)"
    ],
    collectCoverageFrom: [
        "src/web/**/*.(ts|tsx)"
    ]
}