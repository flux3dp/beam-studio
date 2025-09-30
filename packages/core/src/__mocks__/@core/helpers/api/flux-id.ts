/**
 * Mock implementation of @core/helpers/api/flux-id
 * This mock provides sensible defaults for all exported functions and objects.
 * Tests can override specific behaviors using jest.spyOn() or by reassigning mock functions.
 */

// Constants
export const FLUXID_HOST = 'https://id.flux3dp.com';

// Mock axios instance
export const axiosFluxId = {
  defaults: {
    headers: {
      delete: {},
      post: {},
      put: {},
    },
    withCredentials: true,
  },
  delete: jest.fn(),
  get: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  },
  post: jest.fn(),
  put: jest.fn(),
};

// Mock EventEmitter for fluxIDEvents
export const fluxIDEvents = {
  emit: jest.fn(),
  off: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

// Mock BroadcastChannel for fluxIDChannel
export const fluxIDChannel = {
  close: jest.fn(),
  onmessage: null as ((event: MessageEvent) => void) | null,
  postMessage: jest.fn(),
};

// Mock user functions
export const getCurrentUser = jest.fn(() => null);

export const getInfo = jest.fn(async () => null);

export const signIn = jest.fn(async (signInData: any) => ({
  email: signInData.email,
  status: 'ok',
}));

export const signOut = jest.fn(async () => true);

export const signInWithFBToken = jest.fn(async () => true);

export const signInWithGoogleCode = jest.fn(async () => true);

// Preferences functions
export const getPreference = jest.fn(async () => ({}));

export const setPreference = jest.fn(async () => true);

// OAuth functions
export const getRedirectUri = jest.fn((withState = true) => {
  const baseUri = 'https://id.flux3dp.com/api/beam-studio/auth';

  if (withState) {
    return `${baseUri}?isWeb=true&state=${encodeURIComponent(JSON.stringify({ origin: 'http://localhost' }))}`;
  }

  return `${baseUri}?isWeb=true`;
});

export const externalLinkFBSignIn = jest.fn();

export const externalLinkGoogleSignIn = jest.fn();

export const externalLinkMemberDashboard = jest.fn(async () => undefined);

// Noun Project functions
export const getNPIconsByTerm = jest.fn(async () => null);

export const getNPIconByID = jest.fn(async () => null);

// Utility functions
export const getDefaultHeader = jest.fn(() => undefined);

export const recordMachines = jest.fn(async () => undefined);

// Init function
export const init = jest.fn(async () => undefined);

export const submitRating = jest.fn(async (_ratingData: any) => ({
  status: 'ok',
}));

// Default export
export default {
  getPreference,
  init,
  setPreference,
};
