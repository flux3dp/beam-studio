import type { ChangeEvent } from 'react';
import React, { memo, useEffect, useRef, useState } from 'react';

import {
  CopyOutlined,
  DislikeFilled,
  DislikeOutlined,
  LikeFilled,
  LikeOutlined,
  LoadingOutlined,
  PauseCircleFilled,
  RedoOutlined,
} from '@ant-design/icons';
import { Button, Flex, Input, List, notification } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { match, P } from 'ts-pattern';
import { v4 } from 'uuid';

import LeftPanelIcons from '@core/app/icons/left-panel/LeftPanelIcons';
import browser from '@core/implementations/browser';

import styles from './index.module.scss';
import { useChatStore } from './store/useChatStore';
import { fetchDifyStreamedResponse } from './utils/dify/fetchDifyResponse';
import { sendMessageFeedBack } from './utils/dify/sendMessageFeedBack';

const UnmemorizedChat = () => {
  const {
    conversationId,
    currentBotMessageId,
    messages,
    setConversationId,
    setCurrentBotMessageId,
    setMessages,
    userId,
  } = useChatStore();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const floatingAreaRef = useRef<HTMLDivElement>(null);
  const [notifyApi, notificationContextHolder] = notification.useNotification({
    duration: 2,
    getContainer: () => chatContainerRef.current || document.body, // Fallback if ref isn't ready
    placement: 'top',
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Dynamically adjust messagesArea padding-bottom based on floatingArea height
  useEffect(() => {
    const messagesAreaDiv = messagesEndRef.current?.parentElement; // This should be .messagesArea

    if (!messagesAreaDiv || !floatingAreaRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        const basePadding = 16;

        messagesAreaDiv.style.paddingBottom = `${Math.max(height + basePadding, 52)}px`;
      }
    });

    resizeObserver.observe(floatingAreaRef.current);

    // Set initial padding
    const initialHeight = floatingAreaRef.current.offsetHeight;
    const basePadding = 16;

    if (messagesAreaDiv) {
      messagesAreaDiv.style.paddingBottom = `${Math.max(initialHeight + basePadding, 52)}px`;
    }

    return () => {
      resizeObserver.disconnect();

      if (messagesAreaDiv) {
        messagesAreaDiv.style.paddingBottom = ''; // Reset to CSS defined value on unmount
      }
    };
  }, []); // Ensure this runs after floatingAreaRef is attached

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const callFetchDifyResponse = async (text: string) => {
    if (isLoading) return; // Prevent multiple calls

    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();

    const abortSignal = abortControllerRef.current.signal;

    // Use a unique ID for the placeholder message that will be updated by the stream
    setMessages((prev) => [...prev, { feedback: null, id: 'place_holder', inputQuery: text, sender: 'Bot', text: '' }]);

    try {
      await fetchDifyStreamedResponse({
        abortSignal,
        conversationId,
        setConversationId,
        setCurrentBotMessageId,
        setIsLoading,
        setMessages,
        text,
        userId,
      });
    } finally {
      // setCurrentBotMessageId() is called in handleStopResponding for aborts,
      // or here if the request completes/fails for other reasons.
      if (!abortSignal.aborted) {
        setCurrentBotMessageId();
      }

      abortControllerRef.current = null; // Clean up controller
    }
  };

  const handleSend = ({
    clearInputValue = false,
    text = inputValue,
    updateMessages = true,
  }: { clearInputValue?: boolean; text?: string; updateMessages?: boolean } = {}) => {
    const trimmedText = text.trim();

    if (trimmedText === '' || isLoading) return;

    const id = v4();

    if (updateMessages) {
      setMessages((prev) => [...prev, { id, sender: 'User', text: trimmedText }]);
    }

    if (clearInputValue) {
      // If the text is from an option or resend, we don't want to clear the input
      setInputValue('');
    }

    callFetchDifyResponse(text);
  };

  const handleRegenerate = (text: string, messageId: string) => {
    const message = messages.findIndex((msg) => msg.id === messageId);

    if (message !== -1) {
      setMessages(messages.slice(0, message));
      handleSend({ text, updateMessages: false });
    }
  };

  const handleStopResponding = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(false); // Immediately update loading state

    const stoppedMessageId = currentBotMessageId; // Get ID before clearing

    setCurrentBotMessageId(); // Clear the current bot message ID in the store

    setMessages((prev) => {
      if (stoppedMessageId) {
        const messageExists = prev.find((msg) => msg.id === stoppedMessageId);

        if (messageExists) {
          return prev.map((msg) =>
            msg.id === stoppedMessageId ? { ...msg, text: (msg.text || '') + '\n\n(Response stopped by user)' } : msg,
          );
        }
      }

      // If the message was a pure placeholder and got removed, or ID not found, return prev
      return prev;
    });
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check if the Enter key was pressed, Shift was not held, AND
    // the event is NOT part of an IME composition session.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault(); // Prevent newline if only Enter is pressed for sending
      handleSend({ clearInputValue: true }); // Send the message
    }
    // If Shift + Enter, default behavior (insert newline) is allowed.
    // If Enter is pressed during IME composition (e.g., to select a character),
    // the `!e.nativeEvent.isComposing` condition will be false,
    // so handleSend() won't be called, allowing the IME to function correctly.
  };

  const handleOptionClick = (text: string) => {
    if (!isLoading) {
      handleSend({ text });
    }
  };

  const handleFeedbackClick = async (
    messageId: string,
    currentFeedbackOnMessage: 'dislike' | 'like' | null,
    clickedButtonType: 'dislike' | 'like',
  ) => {
    const newFeedbackState = currentFeedbackOnMessage === clickedButtonType ? null : clickedButtonType;

    setMessages((prevMessages) =>
      prevMessages.map((msg) => (msg.id === messageId ? { ...msg, feedback: newFeedbackState } : msg)),
    );

    try {
      await sendMessageFeedBack(messageId, userId, newFeedbackState);
      notifyApi.success({
        duration: 2,
        key: `feedback-${messageId}`,
        message: `Feedback ${newFeedbackState ? 'updated' : 'removed'}.`,
      });
    } catch (error) {
      console.error('Failed to send feedback:', error);
      notifyApi.error({ duration: 2, key: `feedback-error-${messageId}`, message: 'Failed to update feedback.' });
      // Revert UI if backend call fails
      setMessages((prevMessages) =>
        prevMessages.map(
          (msg) => (msg.id === messageId ? { ...msg, feedback: currentFeedbackOnMessage } : msg), // Revert to original
        ),
      );
    }
  };

  return (
    <div className={styles.chatContainer} ref={chatContainerRef}>
      {notificationContextHolder}
      <div className={styles.messagesArea}>
        <List
          dataSource={messages}
          itemLayout="vertical"
          renderItem={(item) => {
            const isUser = item.sender === 'User';
            const showSpinner = isLoading && item.id === currentBotMessageId && item.text === '';
            const alignerClasses = `${styles.messageAligner} ${isUser ? styles.user : styles.bot}`;
            const bubbleClasses = `${styles.messageBubble} ${isUser ? styles.userBubble : styles.botBubble}`;
            const optionsContainerClasses = `${styles.optionsContainer} ${item.text ? styles.withBorder : styles.noBorder}`;
            const commonButtonProps = (icon: React.ReactNode, onClickHandler: React.MouseEventHandler) =>
              ({ disabled: showSpinner, icon, onClick: onClickHandler, size: 'small' }) as const;
            const CopyAction = () => (
              <Button
                {...commonButtonProps(<CopyOutlined />, () => {
                  navigator.clipboard.writeText(item.text);
                  notifyApi.success({ message: 'Copied to clipboard' });
                })}
              />
            );
            const itemActions = match({ item, showSpinner })
              .with(P.union({ item: { text: P.nullish } }, { showSpinner: true }), () => [])
              .with({ item: { sender: 'User' } }, () => [<CopyAction key={item.id.concat('-copy-user')} />])
              .with({ item: { sender: 'Bot' } }, ({ item: botItem }) => {
                const isLiked = botItem.feedback === 'like';
                const isDisliked = botItem.feedback === 'dislike';
                const activeStyle = { color: '#1677ff' }; // Ant Design primary blue

                return [
                  <CopyAction key={item.id.concat('-copy-bot')} />,
                  <Button
                    icon={<RedoOutlined />}
                    key={botItem.id.concat('-regenerate')}
                    onClick={() => handleRegenerate(botItem.inputQuery!, botItem.id)}
                    size="small"
                    style={{ display: !botItem.inputQuery ? 'none' : 'block' }} // Hide if no query to regenerate
                  />,
                  <Button
                    icon={isLiked ? <LikeFilled /> : <LikeOutlined />}
                    key={botItem.id.concat('-like')}
                    onClick={() => handleFeedbackClick(botItem.id, botItem.feedback, 'like')}
                    size="small"
                    style={isLiked ? activeStyle : {}}
                  />,
                  <Button
                    icon={isDisliked ? <DislikeFilled /> : <DislikeOutlined />}
                    key={botItem.id.concat('-dislike')}
                    onClick={() => handleFeedbackClick(botItem.id, botItem.feedback, 'dislike')}
                    size="small"
                    style={isDisliked ? activeStyle : {}} // Using blue for dislike as per "similar to 2"
                  />,
                ];
              })
              .otherwise(() => []);

            return (
              <List.Item className={styles.messageListItem}>
                <div className={alignerClasses}>
                  <div className={bubbleClasses}>
                    <>
                      {showSpinner ? (
                        <LoadingOutlined />
                      ) : (
                        <ReactMarkdown
                          components={{
                            a: ({ children, href, node: _node, ...props }) => (
                              <a
                                href={href}
                                rel="noopener noreferrer"
                                target="_blank"
                                {...props}
                                onClick={(e) => {
                                  e.preventDefault();
                                  browser.open(href!);
                                }}
                              >
                                {children}
                              </a>
                            ),
                          }}
                          remarkPlugins={[remarkGfm]}
                        >
                          {item.text}
                        </ReactMarkdown>
                      )}
                      {itemActions.length > 0 && <div className={styles.actionsContainer}>{itemActions}</div>}
                    </>
                    {item.sender === 'Bot' && item.options && !isLoading && (
                      <div className={optionsContainerClasses}>
                        <Flex gap="small" wrap="wrap">
                          {item.options.map((option, index) => (
                            <Button
                              className={styles.optionButton}
                              disabled={isLoading}
                              key={index}
                              onClick={() => handleOptionClick(option)}
                              size="small"
                            >
                              {option}
                            </Button>
                          ))}
                        </Flex>
                      </div>
                    )}
                    {/* End of bubbleClasses div */}
                  </div>
                  {/* End of alignerClasses div */}
                </div>
              </List.Item>
            );
          }}
          split={false}
        />
        <div ref={messagesEndRef} />
      </div>

      <Flex align="center" className={styles.floatingArea} ref={floatingAreaRef} vertical>
        {isLoading && (
          <Button
            className={styles.stopRespondingButton} // Add styles for this class
            icon={<PauseCircleFilled />}
            onClick={handleStopResponding}
            style={{ border: '1px solid grey', borderRadius: '8px', color: 'grey', marginBottom: '10px' }} // Adjust styling as needed
          >
            Stop Responding
          </Button>
        )}
        <div className={styles.inputAreaContainer}>
          <Input.TextArea
            autoSize={{ maxRows: 9, minRows: 2 }}
            className={styles.inputArea}
            onChange={handleInputChange}
            onPressEnter={handleInputKeyPress}
            placeholder="Ask Beamy a question."
            value={inputValue}
            variant="borderless"
          />
          <Button
            className={styles.floatingSendButton}
            icon={<LeftPanelIcons.Send />}
            loading={isLoading && { icon: <LeftPanelIcons.Send /> }}
            onClick={() => handleSend({ clearInputValue: true })}
            type="primary"
          />
        </div>
        <div className={styles.chatDisclaimer}>Beamy can make mistakes. Check important info.</div>
      </Flex>
    </div>
  );
};

const Chat = memo(UnmemorizedChat, () => true);

export default Chat;
