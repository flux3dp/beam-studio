import React, { forwardRef, useState } from 'react';

interface Props {
  id: string;
  placeholder: string;
}

/**
 * @deprecated The method should not be used
 */

const ShowablePasswordInput = forwardRef<HTMLInputElement, Props>(({ id, placeholder }: Props, ref: any) => {
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
});

export default ShowablePasswordInput;
