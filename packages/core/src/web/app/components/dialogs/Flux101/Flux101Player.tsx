// The YouTube player, rendered inside whichever slot is on screen (dialog or PiP). Switching
// slots remounts the iframe; `useYouTubePlayer` resumes playback if the video was playing (D24).
// §5.5 states lie over the thumbnail: "You're offline" while the browser is offline, and the video
// error with Retry / Open on YouTube when the API or the video failed to load.
import React, { useRef, useSyncExternalStore } from 'react';

import { DisconnectOutlined, ExportOutlined, WarningOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import { LESSONS } from './catalog';
import styles from './Flux101Player.module.scss';
import { useYouTubePlayer } from './useYouTubePlayer';

interface Flux101PlayerProps {
  lessonId: string;
}

const onConnectivity = (cb: () => void): (() => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);

  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

const Flux101Player = ({ lessonId }: Flux101PlayerProps): React.JSX.Element => {
  const { alert, flux_101: t } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const online = useSyncExternalStore(onConnectivity, () => navigator.onLine);
  const { error, retry } = useYouTubePlayer(host, lessonId);

  // the lesson's thumbnail shows while the iframe boots, instead of a black box
  const { youtubeId } = LESSONS.find((l) => l.id === lessonId)!;

  return (
    <div
      className={styles.player}
      style={{ backgroundImage: `url(https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg)` }}
    >
      <div ref={host} />
      {!online && (
        <div className={styles.overlay}>
          <DisconnectOutlined />
          {t.offline}
        </div>
      )}
      {online && error && (
        <div className={styles.overlay}>
          <WarningOutlined />
          {t.video_error}
          <div className={styles.actions}>
            <Button onClick={retry}>{alert.retry}</Button>
            <Button
              icon={<ExportOutlined />}
              iconPosition="end"
              onClick={() => browser.open(`https://www.youtube.com/watch?v=${youtubeId}`)}
              type="primary"
            >
              {t.open_on_youtube}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flux101Player;
