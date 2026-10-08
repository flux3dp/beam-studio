// FLUX ID sync (PRD §9, R14, R19a). Cloud copy lives in the `bxpref` preference `flux101_progress`
// (companion PRD adds the column; until then the server answers INVALID_KEY and this degrades to
// local-only). Login → pull + completion-biased merge + claim the anonymous bucket; every bucket
// write made in this tab while signed in → debounced push of the whole bucket, plus a credit-grant
// request for any `watched` lesson the server has not confirmed yet (R12a; the server is idempotent
// per lesson). Tabs that only receive the change over IPC do not sync it again.
import { funnel } from 'remeda';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import alertConstants from '@core/app/constants/alert-constants';
import fluxId, { fluxIDEvents } from '@core/helpers/api/flux-id';
import i18n from '@core/helpers/i18n';

import { useFlux101Store } from './flux101Store';
import {
  adoptOnLogin,
  ANONYMOUS,
  claimedByOther,
  type Flux101Bucket,
  getBucket,
  markCreditsGranted,
  maskEmail,
  onBucketWrite,
  ownerKey,
  ungrantedLessonIds,
} from './progress';

const PREF_KEY = 'flux101_progress';

const pull = async (): Promise<Flux101Bucket | undefined> => {
  const res = await fluxId.getPreference(PREF_KEY, true);

  return res?.status === 'ok' && res.value?.lessons ? (res.value as Flux101Bucket) : undefined;
};

// the player ticks every second; one push per quiet 5 s is plenty
const push = funnel(
  async () => {
    const owner = ownerKey();

    if (owner === ANONYMOUS) return;

    const ok = await fluxId.setPreference({ [PREF_KEY]: getBucket(owner) });

    if (ownerKey() === owner) useFlux101Store.setState({ synced: ok });
  },
  { minQuietPeriodMs: 5000, triggerAt: 'end' },
);

// A grant the server did not answer ok (offline, 429 from its 30/hour throttle, endpoint not
// deployed yet) is not asked again before this; the lessons stay pending and the next write after
// the window retries. Without it every playback write would re-fire the request.
const GRANT_BACKOFF_MS = 10 * 60_000;
let grantBlockedUntil = 0;

// R12a: one request per quiet second covers the completion tick and the post-login back-grant alike
const grant = funnel(
  async () => {
    const owner = ownerKey();

    if (owner === ANONYMOUS || Date.now() < grantBlockedUntil) return;

    const pending = ungrantedLessonIds(getBucket(owner));

    if (!pending.length) return;

    const granted = await fluxId.grantFlux101Credits(pending);

    if (!granted) {
      grantBlockedUntil = Date.now() + GRANT_BACKOFF_MS;

      return;
    }

    if (ownerKey() === owner) markCreditsGranted(granted, owner);
  },
  { minQuietPeriodMs: 1000, triggerAt: 'end' },
);

// who we have adopted this session; starts as nobody so a session restored before this module
// loaded is still pulled and merged by the start-up call
let lastOwner: string = ANONYMOUS;

const onUserChange = async (): Promise<void> => {
  const owner = ownerKey();

  if (owner === lastOwner) return; // 'update-user' also fires for plain info refreshes

  lastOwner = owner;
  grantBlockedUntil = 0; // the server throttles per user, so one account's failure must not block the next

  if (owner === ANONYMOUS) {
    useFlux101Store.setState({ synced: undefined });

    return; // logout: the anonymous bucket already mirrors the last claimer
  }

  adoptOnLogin(owner, await pull()); // writeBucket -> onBucketWrite -> push + grant
};

let started = false;

/** Idempotent; called from the course entry module so it runs once per app session. */
export const startFlux101Sync = (): void => {
  if (started) return;

  started = true;
  fluxIDEvents.on('update-user', onUserChange);
  onBucketWrite(() => {
    if (ownerKey() !== ANONYMOUS) {
      push.call();
      grant.call();
    }
  });
  onUserChange(); // session restored before this module loaded
};

let warned = false;

/** §5.5: logged out on a bucket another account claimed → once per session, offer to sign in. */
export const warnIfClaimed = (): void => {
  const email = claimedByOther();

  if (warned || !email || !navigator.onLine) return;

  warned = true;

  const t = i18n.lang.flux_101;

  alertCaller.popUp({
    buttonLabels: [i18n.lang.global.skip, i18n.lang.flux_id_login.login],
    buttonType: alertConstants.CUSTOM,
    callbacks: [() => {}, () => dialogCaller.showLoginDialog()],
    message: sprintf(t.claimed_warning, { email: maskEmail(email) }),
    primaryButtonIndex: 1,
  });
};
