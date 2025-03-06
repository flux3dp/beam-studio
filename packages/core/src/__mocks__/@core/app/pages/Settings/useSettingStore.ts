import { create } from 'zustand';

const mockStore = {
  beamboxPreferenceChanges: {},
  configChanges: {},
  getConfig: jest.fn(),
  getPreference: jest.fn(),
  setConfig: jest.fn(),
  setPreference: jest.fn(),
  updateToStorage: jest.fn(),
};

export const useSettingStore = create(() => mockStore);
