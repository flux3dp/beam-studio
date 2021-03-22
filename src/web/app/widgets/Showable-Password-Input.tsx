const classNames = requireNode('classnames');
const React = requireNode('react');
const { useState } = requireNode('react');

const ShowablePasswordInput = React.forwardRef(({ divClassName, placeholder, id }, ref: any) => {
    const [visible, setVisible] = useState(false);

    return (
        <div className={classNames('showable-password-input', divClassName)}>
            <input
                id={id}
                ref={ref}
                type={visible ? 'text' : 'password'}
                placeholder={placeholder} 
                onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
            />
            <img src={visible ? 'img/right-panel/icon-eyeclose.svg' : 'img/right-panel/icon-eyeopen.svg'}
                onClick={() => setVisible(!visible)}
            />
        </div>
    );
});

export default ShowablePasswordInput;