/** Jest configuration extracted from package.json to avoid JSON parsing issues */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/tests/setupTests.ts"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/src/tests/styleMock.js",
    "\\.(png|jpg|jpeg|gif|svg|mp3|wav)$": "<rootDir>/src/tests/fileMock.js"
  }
};