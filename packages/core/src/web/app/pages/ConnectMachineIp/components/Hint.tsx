import React from 'react';

import browser from '@core/implementations/browser';

import styles from './Hint.module.scss';

const Hint = ({ message }: { message: string }): React.JSX.Element => {
  // Regex to match <a> tags with href and text inside
  const linkRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi;

  const parseMessage = (text: string) => {
    const parts = [];
    let lastIndex = 0;
    let match = linkRegex.exec(text);

    while (match !== null) {
      const [fullMatch, url, linkText] = match;
      const { index } = match;

      if (index > lastIndex) {
        parts.push(text.slice(lastIndex, index));
      }

      parts.push(
        <span className={styles.link} key={url} onClick={() => browser.open(url)}>
          {linkText}
        </span>,
      );

      lastIndex = index + fullMatch.length;

      match = linkRegex.exec(text);
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return <div className={styles.contents}>{parseMessage(message)}</div>;
};

export default Hint;
