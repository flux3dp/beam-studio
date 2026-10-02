// Completion celebration (PRD §5.4): watches the active bucket and, once per newly completed
// lesson, opens the CelebrationDialog (confetti included) — or the certificate with confetti rain
// on 23/23. Derived from `lessons` only, so it works the same for watched and marked-done
// completions; mount it where the course is alive (the course window incl. PiP, the Welcome tab).
import { useEffect, useRef } from 'react';

import { isCourseComplete, isLessonComplete, useFlux101Bucket } from './progress';

import { showCelebrationDialog, showCertificate } from './index';

export const useCelebration = (): void => {
  const bucket = useFlux101Bucket();
  const seen = useRef<null | Set<string>>(null);

  useEffect(() => {
    const done = new Set(Object.keys(bucket.lessons).filter((id) => isLessonComplete(bucket, id)));
    const fresh = seen.current ? [...done].filter((id) => !seen.current!.has(id)) : [];

    seen.current = done; // first run only takes the baseline

    if (!fresh.length) return;

    if (isCourseComplete(bucket)) showCertificate(true);
    else showCelebrationDialog(fresh[0]);
  }, [bucket]);
};
