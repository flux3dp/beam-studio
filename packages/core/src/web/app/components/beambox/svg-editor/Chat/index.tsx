import React, { memo, useMemo, useRef } from 'react';

import { Flex } from 'antd';
import classNames from 'classnames';
import { match, P } from 'ts-pattern';

import Drawer from '@core/app/widgets/Drawer';
import { isAtPage } from '@core/helpers/hashHelper';
import useWorkarea from '@core/helpers/hooks/useWorkarea';

import styles from './index.module.scss';
import { useChatStore } from './useChatStore';

const UnmemorizedChat = () => {
  const { isChatShown, setIsChatShown } = useChatStore();
  const floatingAreaRef = useRef<HTMLDivElement>(null);
  const workarea = useWorkarea();
  const url = match(workarea)
    .with('fbm1', () => 'bPvkL6zLs0RnJUm9') // beamo
    .with(P.union('fbb1b', 'fbb1p'), () => 'N05117vn4lNB5WJk') // Beambox, Beambox Pro
    .with('fbb2', () => 'MmX2ialzth55uAjH') // Beambox II
    .with('fhexa1', () => '18ssC0u14uPrRxHJ') // HEXA
    .with('fpm1', () => 'FtMMdyuoqCoKlnw1') // Promark
    .with('ado1', () => 'bG66TKuYtJ52GLGP') // Ador
    .otherwise(() => 'bNnVJgi3N9b7X4KV'); // Universal
  const inWelcomePage = useMemo(() => isAtPage('welcome'), []);

  return (
    <Drawer isOpen={isChatShown} setIsOpen={setIsChatShown}>
      <div className={classNames(styles['chat-container'], { [styles['welcome-page']]: inWelcomePage })}>
        <iframe className={styles['chat-iframe']} id="beamy-chat" src={`https://udify.app/chatbot/${url}`} />
        <Flex align="center" className={styles['floating-area']} ref={floatingAreaRef} vertical>
          <div className={styles['chat-disclaimer']}>Beamy can make mistakes. Check important info.</div>
        </Flex>
      </div>
    </Drawer>
  );
};

const Chat = memo(UnmemorizedChat, () => true);

export default Chat;
