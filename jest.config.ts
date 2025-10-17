import type { Config } from 'jest';

const config: Config = {
  displayName: 'mono-repo-desafio',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps', '<rootDir>/packages'],
  testMatch: ['**/__tests__ *.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'apps *.ts',
    'packages *.ts',
    '!** node_modules dist coverage *.spec.ts',
    '!** test/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapping: {
    '^@repo/(.*)$': '<rootDir>/packages/$1/src',
  },
  testTimeout: 30000,
  maxWorkers: '50%',
  verbose: true,
};

export default config;
