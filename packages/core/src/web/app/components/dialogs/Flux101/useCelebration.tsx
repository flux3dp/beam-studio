// Completion celebration (PRD §5.4): watches the active bucket and, once per newly completed
// lesson, opens the CelebrationDialog (confetti included) — or the certificate with confetti rain
// on 23/23. A lesson marked done by hand and later actually watched celebrates again (that is the
// moment the credit is earned). Mount it where the course is alive (course window incl. PiP,
// Welcome tab).
import { useEffect, useRef } from 'react';

import { isCourseComplete, isLessonComplete, useFlux101Bucket } from './progress';

import { showCelebrationDialog, showCertificate } from './index';

export const useCelebration = (): void => {
  const bucket = useFlux101Bucket();
  const seen = useRef<null | Set<string>>(null);

  useEffect(() => {
    // keyed by id + completedVia so the marked_done → watched upgrade counts as a new event
    const done = new Set(
      Object.entries(bucket.lessons)
        .filter(([id]) => isLessonComplete(bucket, id))
        .map(([id, l]) => `${id}:${l.completedVia}`),
    );
    const prev = seen.current;
    const fresh = prev ? [...done].filter((key) => !prev.has(key)) : [];

    seen.current = done; // first run only takes the baseline

    if (!fresh.length) return;

    const [lessonId] = fresh[0].split(':');
    const newlyCompleted = ![...prev!].some((key) => key.startsWith(`${lessonId}:`));

    // the certificate is for the 23rd completion, not for upgrading an already finished course
    if (newlyCompleted && isCourseComplete(bucket)) showCertificate(true);
    else showCelebrationDialog(lessonId);
  }, [bucket]);
};
