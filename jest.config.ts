import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',
  testRegex: '.*\.spec\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'bundler',
          isolatedModules: true
        }
      }
    ]
  },
  testEnvironment: 'node'
};

export default config;
