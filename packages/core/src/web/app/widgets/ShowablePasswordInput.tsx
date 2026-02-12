import React, { useState } from 'react';

interface Props {
  id: string;
  placeholder: string;
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * @deprecated The method should not be used
 */
const ShowablePasswordInput = ({ id, placeholder, ref }: Props) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="showable-password-input">
      <input
        id={id}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.stopPropagation()}
        placeholder={placeholder}
        ref={ref}
        type={visible ? 'text' : 'password'}
      />
      <img
        onClick={() => setVisible(!visible)}
        src={visible ? 'img/right-panel/icon-eyeclose.svg' : 'img/right-panel/icon-eyeopen.svg'}
      />
    </div>
  );
};

export default ShowablePasswordInput;
