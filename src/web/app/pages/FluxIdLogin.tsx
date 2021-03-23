import { showLoginDialog } from 'app/views/FluxIdLogin';


const React = requireNode('react');
const { useEffect } = requireNode('react');

// Empty page to show login dialog
const FluxIdLogin = () => {
    useEffect(() => {
        showLoginDialog(() => {
            location.hash = '#initialize/connect/select-connection-type';
        });
    }, []);
    return <div className="top-bar"/>;
}

export default () => FluxIdLogin;
