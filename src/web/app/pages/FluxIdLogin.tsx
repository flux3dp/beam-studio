import dialog from 'app/actions/dialog-caller';


const React = requireNode('react');
const { useEffect } = requireNode('react');

// Empty page to show login dialog
const FluxIdLogin = () => {
    useEffect(() => {
        dialog.showLoginDialog(() => {
            location.hash = '#initialize/connect/select-connection-type';
        });
    }, []);
    return <div className="top-bar"/>;
}

export default () => FluxIdLogin;
