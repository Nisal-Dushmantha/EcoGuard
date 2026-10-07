module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          target: 'es2022',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          isolatedModules: true,
        },
        diagnostics: {
          ignoreCodes: [151002, 1343],
        },
      },
    ],
  },
  moduleNameMapper: {
    'upload\\.middleware(\\.js)?$': '<rootDir>/src/__tests__/mocks/uploadMiddlewareMock.ts',
    '^(.*)\\.js$': '$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/models/CommunityReport.model.ts',
    'src/modules/mobile/controllers/conflict.controller.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json', 'html'],
};
