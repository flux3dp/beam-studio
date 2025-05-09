import React, { memo, useRef } from 'react';

import { Flex } from 'antd';

import styles from './index.module.scss';

const UnmemorizedChat = () => {
  const floatingAreaRef = useRef<HTMLDivElement>(null);

  return (
    <div className={styles['chat-container']}>
      <iframe className={styles['chat-iframe']} id="beamy-chat" src="https://udify.app/chatbot/bNnVJgi3N9b7X4KV" />
      <Flex align="center" className={styles['floating-area']} ref={floatingAreaRef} vertical>
        <div className={styles['chat-disclaimer']}>Beamy can make mistakes. Check important info.</div>
      </Flex>
    </div>
  );
};

const Chat = memo(UnmemorizedChat, () => true);

export default Chat;
