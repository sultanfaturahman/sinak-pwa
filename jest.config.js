/**
 * Jest Configuration for SiNaK PWA
 * Prevents "FIRESTORE INTERNAL ASSERTION FAILED" errors during testing
 */

module.exports = {
  // Test environment
  testEnvironment: 'node', // Use Node.js instead of jsdom to avoid Firebase browser conflicts

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],

  // Module name mapping for ES modules and Vue files
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/test/__mocks__/fileMock.js'
  },

  // Transform files
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'vue'],

  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(js|jsx)',
    '<rootDir>/src/**/*.(test|spec).(js|jsx)'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,vue}',
    '!src/main.js',
    '!src/**/__tests__/**',
    '!**/node_modules/**'
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output for debugging
  verbose: true,

  // Test timeout (prevent hanging tests)
  testTimeout: 10000,

  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/src'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],

  // Transform ignore patterns (don't transform node_modules except specific packages)
  transformIgnorePatterns: [
    'node_modules/(?!(firebase|@firebase)/)'
  ]
};
