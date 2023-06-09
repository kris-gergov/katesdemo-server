module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': ['<rootDir>/$1'],
    '^@config/(.*)$': ['<rootDir>/src/config/$1'],
    '^@controllers/(.*)$': ['<rootDir>/src/api/controllers/$1'],
    '^@databases/(.*)$': ['<rootDir>/src/api/databases/$1'],
    '^@schemas/(.*)$': ['<rootDir>/src/api/schemas/$1'],
    '^@exceptions/(.*)$': ['<rootDir>/src/api/exceptions/$1'],
    '^@interfaces/(.*)$': ['<rootDir>/src/api/interfaces/$1'],
    '^@middlewares/(.*)$': ['<rootDir>/src/api/middlewares/$1'],
    '^@models/(.*)$': ['<rootDir>/src/api/models/$1'],
    '^@routes/(.*)$': ['<rootDir>/src/api/routes/$1'],
    '^@services/(.*)$': ['<rootDir>/src/api/services/$1'],
    '^@utils/(.*)$': ['<rootDir>/src/utils/$1'],
    '^@tests/(.*)$': ['<rootDir>/src/tests/$1'],
  },
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
