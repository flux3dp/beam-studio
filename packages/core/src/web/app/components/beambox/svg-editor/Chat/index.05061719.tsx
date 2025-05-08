import type { ChangeEvent } from 'react';
import React, { useEffect, useRef, useState } from 'react';

import { Button, Flex, Input, List, Space, Spin } from 'antd';

// --- Dify API Configuration ---
const DIFY_API_KEY = '';
const DIFY_API_BASE_URL = '';
const DIFY_USER_ID = '';
// --- End of Dify API Configuration ---

type Message = {
  id: string;
  options?: string[]; // Optional array of strings for interactive options (usually for bot messages)
  sender: 'Bot' | 'User';
  text: string;
};

// Helper function to generate unique IDs (simple version)
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(), // Use generated ID
      sender: 'Bot',
      text: 'Hello, this is Bibi, an AI assistant for the FLUX Laser Product, how may I help you?',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false); // State to track loading status
  const [conversationId, setConversationId] = useState<null | string>(null); // State to store Dify conversation ID
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentBotMessageId = useRef<null | string>(null); // Ref to track the ID of the bot message being streamed

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Function to fetch response from Dify API in streaming mode
  const fetchDifyResponse = async (text: string) => {
    setIsLoading(true);
    currentBotMessageId.current = generateId(); // Generate ID for the upcoming bot message

    // Add an empty bot message placeholder immediately
    setMessages((prev) => [...prev, { id: currentBotMessageId.current!, sender: 'Bot', text: '' }]);

    const url = `${DIFY_API_BASE_URL}/chat-messages`;
    const headers = {
      Authorization: `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    };
    const body = JSON.stringify({
      conversation_id: conversationId || undefined, // Send conversation_id if it exists
      inputs: {}, // Add any input variables if your Dify prompt requires them
      query: text,
      response_mode: 'streaming',
      user: DIFY_USER_ID,
    });

    try {
      const response = await fetch(url, {
        body,
        headers,
        method: 'POST',
      });

      if (!response.ok) {
        // Handle HTTP errors
        const errorData = (await response.json()) as any;

        console.error('Dify API Error:', errorData);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === currentBotMessageId.current
              ? { ...msg, text: `Error: ${errorData.message || response.statusText}` }
              : msg,
          ),
        );
        setIsLoading(false);
        currentBotMessageId.current = null;

        return;
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let accumulatedData = '';
      let firstMessageReceived = false; // Flag to capture conversation_id only once

      while (!done) {
        const { done: readerDone, value } = await reader.read();

        done = readerDone;

        if (value) {
          accumulatedData += decoder.decode(value, { stream: true });

          // Dify SSE format uses `\n\n` as a separator
          const eventStrings = accumulatedData.split('\n\n');

          // Process complete events, keep incomplete part for next chunk
          for (const eventString of eventStrings) {
            const eventStr = eventString.trim();

            if (eventStr.startsWith('data: ')) {
              try {
                const jsonData = JSON.parse(eventStr.substring(6)) as any; // Remove 'data: ' prefix

                if (jsonData.event === 'message') {
                  const answerChunk = jsonData.answer;
                  const currentConversationId = jsonData.conversation_id;

                  // Update conversationId from the first message event
                  if (currentConversationId && !firstMessageReceived) {
                    setConversationId(currentConversationId);
                    firstMessageReceived = true;
                  }

                  // Append the answer chunk to the current bot message
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === currentBotMessageId.current ? { ...msg, text: msg.text + answerChunk } : msg,
                    ),
                  );
                } else if (jsonData.event === 'message_end') {
                  // Optional: Handle message end event if needed
                  console.log('Message stream ended. Conversation ID:', jsonData.conversation_id);

                  // Ensure conversation ID is set even if only end event received it somehow
                  if (jsonData.conversation_id && !firstMessageReceived) {
                    setConversationId(jsonData.conversation_id);
                  }
                } else if (jsonData.event === 'error') {
                  console.error('Dify Stream Error Event:', jsonData);
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === currentBotMessageId.current
                        ? { ...msg, text: msg.text + `\nStream Error: ${jsonData.message || 'Unknown error'}` }
                        : msg,
                    ),
                  );
                }
              } catch (e) {
                console.error('Error parsing Dify SSE data:', e, eventStr);
              }
            }
          }
          // Keep the last potentially incomplete part
          accumulatedData = eventStrings[eventStrings.length - 1];
        }
      }

      // Final decode for any remaining data after the loop
      if (accumulatedData) {
        // Process any remaining complete events (though usually handled above)
        // console.log("Remaining data:", accumulatedData) // For debugging
      }
    } catch (error) {
      console.error('Failed to fetch Dify response:', error);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === currentBotMessageId.current ? { ...msg, text: '抱歉，連線時發生錯誤。' } : msg)),
      );
    } finally {
      setIsLoading(false);
      currentBotMessageId.current = null; // Clear the current bot message ID
    }
  };

  const handleSend = (textToSend?: string) => {
    const text = (typeof textToSend === 'string' ? textToSend : inputValue).trim();

    if (text === '' || isLoading) return; // Prevent sending empty messages or while loading

    const newUserMessageId = generateId();

    // Add user message to state
    setMessages((prev) => [...prev, { id: newUserMessageId, sender: 'User', text }]);

    // If the message was sent via the input field, clear it
    if (typeof textToSend !== 'string') {
      setInputValue('');
    }

    // Call Dify API
    fetchDifyResponse(text);
  };

  // handleOptionClick remains the same as it just calls handleSend
  const handleOptionClick = (optionText: string) => {
    if (!isLoading) {
      // Prevent clicking options while loading
      handleSend(optionText);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ backgroundColor: '#DAEDFF', flexGrow: 1, overflowY: 'auto', padding: '16px' }}>
        <List
          dataSource={messages}
          renderItem={(item) => {
            const isUser = item.sender === 'User';
            const alignStyle: React.CSSProperties = {
              display: 'flex',
              justifyContent: isUser ? 'flex-end' : 'flex-start',
              marginBottom: '10px', // Reduced margin slightly
              width: '100%',
            };
            const bubbleStyle: React.CSSProperties = {
              backgroundColor: isUser ? '#1890FF' : '#FCFDFE',
              borderRadius: '12px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)', // Added subtle shadow
              color: isUser ? 'white' : 'black',
              maxWidth: '80%',
              overflowWrap: 'break-word',
              padding: '10px 15px',
              position: 'relative', // Needed for potential spinner positioning
            };

            const optionButtonStyle = {
              borderColor: '#1890FF', // Add border for better visibility
              color: '#1890FF',
              margin: '4px 4px 0 0',
            };

            // Show spinner inside the bot bubble while loading and it's the target bubble
            const showSpinner = isLoading && item.id === currentBotMessageId.current && item.text === '';

            return (
              <List.Item style={{ border: 'none', padding: '0 5px' }}>
                {/* Added horizontal padding */}
                <div style={alignStyle}>
                  <div style={bubbleStyle}>
                    {showSpinner ? <Spin size="small" /> : item.text}
                    {/* Render options only if they exist and the message is not currently loading */}
                    {item.sender === 'Bot' && item.options && !isLoading && (
                      <div
                        style={{
                          borderTop: item.text ? '1px solid rgba(0,0,0,0.1)' : 'none',
                          marginTop: item.text ? '8px' : '0px', // Adjust margin if text is empty
                          paddingTop: '5px',
                        }}
                      >
                        <Flex gap="small" wrap="wrap">
                          {/* Use Flex for better option layout */}
                          {item.options.map((option, index) => (
                            <Button
                              disabled={isLoading} // Disable options while loading
                              key={index}
                              onClick={() => handleOptionClick(option)}
                              size="small"
                              style={optionButtonStyle}
                            >
                              {option}
                            </Button>
                          ))}
                        </Flex>
                      </div>
                    )}
                  </div>
                </div>
              </List.Item>
            );
          }}
          split={false}
        />
        {/* Add a loading indicator at the bottom while waiting */}
        {isLoading && currentBotMessageId.current === null && (
          <div style={{ padding: '10px', textAlign: 'center' }}>
            <Spin />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ backgroundColor: '#fff', borderTop: '1px solid #f0f0f0', padding: '16px' }}>
        {/* Added background */}
        <Space.Compact style={{ width: '100%' }}>
          <Input
            disabled={isLoading} // Disable input while loading
            onChange={handleInputChange}
            onPressEnter={() => handleSend()}
            placeholder="輸入訊息..."
            value={inputValue}
          />
          <Button loading={isLoading} onClick={() => handleSend()} type="primary">
            {/* Show loading state on button */}
            發送
          </Button>
        </Space.Compact>
      </div>
    </div>
  );
};

export default Chat;
