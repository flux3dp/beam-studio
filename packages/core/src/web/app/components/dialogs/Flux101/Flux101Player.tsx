// The YouTube player, rendered inside whichever slot is on screen (dialog or PiP). Switching
// slots remounts the iframe; `useYouTubePlayer` resumes playback if the video was playing (D24).
import React, { useRef } from 'react';

import { LESSONS } from './catalog';
import styles from './Flux101Player.module.scss';
import { useYouTubePlayer } from './useYouTubePlayer';

interface Flux101PlayerProps {
  lessonId: string;
}

const Flux101Player = ({ lessonId }: Flux101PlayerProps): React.JSX.Element => {
  const host = useRef<HTMLDivElement>(null);

  useYouTubePlayer(host, lessonId);

  // the lesson's thumbnail shows while the iframe boots, instead of a black box
  const { youtubeId } = LESSONS.find((l) => l.id === lessonId)!;

  return (
    <div
      className={styles.player}
      style={{ backgroundImage: `url(https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg)` }}
    >
      <div ref={host} />
    </div>
  );
};

export default Flux101Player;
