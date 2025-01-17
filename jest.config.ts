import { getJestProjectsAsync } from '@nx/jest';

export default async () => ({
  projects: [...(await getJestProjectsAsync()), '<rootDir>/packages/core/jest.config.js'],
});
