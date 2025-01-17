import React, { forwardRef, useState } from 'react';

interface Props {
  placeholder: string;
  id: string;
}

/**
 * @deprecated The method should not be used
 */
// eslint-disable-next-line max-len
const ShowablePasswordInput = forwardRef<HTMLInputElement, Props>(({ placeholder, id }: Props, ref: any) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="showable-password-input">
      <input
        id={id}
        ref={ref}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.stopPropagation()}
      />
      <img
        src={visible ? 'img/right-panel/icon-eyeclose.svg' : 'img/right-panel/icon-eyeopen.svg'}
        onClick={() => setVisible(!visible)}
      />
    </div>
  );
});

export default ShowablePasswordInput;
