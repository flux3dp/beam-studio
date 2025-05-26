import React, { memo } from 'react';

import styles from './index.module.scss';

const UnmemorizedChat = () => {
  return (
    <div className={styles['chat-container']}>
      <iframe className={styles['chat-iframe']} id="beamy-chat" src="https://udify.app/chatbot/bNnVJgi3N9b7X4KV" />
    </div>
  );
};

const Chat = memo(UnmemorizedChat, () => true);

export default Chat;
