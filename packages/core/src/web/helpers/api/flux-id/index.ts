export { recordMachines, submitRating } from './activity';
export {
  axiosFluxId,
  externalLinkFBSignIn,
  externalLinkGoogleSignIn,
  externalLinkMemberDashboard,
  FLUXID_HOST,
  fluxIDChannel,
  fluxIDEvents,
  getCurrentUser,
  getDefaultHeader,
  getInfo,
  getRedirectUri,
  type ResponseWithError,
  signIn,
  signInWithFBToken,
  signInWithGoogleCode,
  signOut,
} from './base';
export { getNPIconByID, getNPIconsByTerm } from './nounProject';

import { getPreference, grantFlux101Credits, setPreference } from './activity';
import { init } from './base';

export default {
  getPreference,
  grantFlux101Credits,
  init,
  setPreference,
};
