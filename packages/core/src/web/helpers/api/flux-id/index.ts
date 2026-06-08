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

import { getPreference, setPreference } from './activity';
import { init } from './base';

export default {
  getPreference,
  init,
  setPreference,
};
