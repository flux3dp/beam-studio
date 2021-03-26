import { fluxIDEvents } from 'helpers/api/flux-id';
import { IUser } from 'interfaces/IUser';

const React = requireNode('react');
const { createContext } = React;
export const TopBarContext = createContext();

export interface ITopBarContext {
    updateTopBar: () => void,
    setElement: (elem: Element|null) => void,
    setFileName: (fileName: string) => void,
    setHasUnsavedChange: (hasUnsavedChange: boolean) => void,
    setTopBarPreviewMode: (topBarPreviewMode: boolean) => void,
    getTopBarPreviewMode: () => boolean,
    setShouldStartPreviewController: (shouldStartPreviewController: boolean) => void,
    setStartPreviewCallback: (callback?: Function|null) => void,
    currentUser: IUser,
    isPreviewMode: boolean,
    fileName: string|null,
    selectedElem: Element|null,
    hasUnsavedChange: boolean,
    shouldStartPreviewController: boolean,
    startPreivewCallback: Function|null,
}

export class TopBarContextProvider extends React.Component {
    private props;
    private state: {
        fileName: string|null,
        selectedElem: Element|null,
        hasUnsavedChange: boolean,
        isDrawing: boolean,
        isDrawn: boolean,
        shouldStartPreviewController: boolean,
        currentUser?: IUser
    };
    private isPreviewMode: boolean;
    private startPreivewCallback: Function|null;
    private setState: (newState: any) => {};

    constructor(props) {
        super(props);
        this.state = {
            fileName: null,
            selectedElem: null,
            hasUnsavedChange: false,
            isDrawing: false,
            isDrawn: false,
            shouldStartPreviewController: false,
            currentUser: null,
        }
        this.startPreivewCallback = null;
    }

    componentDidMount() {
        fluxIDEvents.on('update-user', this.setCurrentUser);
    }

    componentWillUnmount() {
        fluxIDEvents.removeListener('update-user', this.setCurrentUser);
    }

    updateTopBar = () => {
        this.setState(this.state);
    }

    setHasUnsavedChange = (hasUnsavedChange: boolean) => {
        this.setState({ hasUnsavedChange });
    }

    setElement = (elem: Element|null) => {
        this.setState({ selectedElem: elem });
    }

    setFileName = (fileName: string) => {
        this.setState({ fileName });
    }

    setPreviewModeIsDrawing = (isDrawing: boolean) => {
        this.setState({ isDrawing })
    }

    setPreviewModeIsDrawn = (isDrawn: boolean) => {
        this.setState({ isDrawn })
    }

    setTopBarPreviewMode = (isPreviewMode: boolean) => {
        const allLayers = document.querySelectorAll('g.layer');
        for (let i = 0; i < allLayers.length; i++) {
            const g = allLayers[i] as SVGGElement;
            if (isPreviewMode) {
                g.style.pointerEvents = 'none';
            } else {
                g.style.pointerEvents = '';
            }
        }
        this.isPreviewMode = isPreviewMode;
    }

    getTopBarPreviewMode = () => {
        return this.isPreviewMode;
    }

    setShouldStartPreviewController = (shouldStartPreviewController: boolean) => {
        this.setState({ shouldStartPreviewController });
    }

    setStartPreviewCallback = (callback?: Function|null) => {
        if (callback) {
            this.startPreivewCallback = callback;
        } else {
            this.startPreivewCallback = null;
        }
    }

    setCurrentUser = (user: IUser) => {
        this.setState({ currentUser: user });
    }

    render() {
        const {
            updateTopBar,
            setElement,
            setFileName,
            setHasUnsavedChange,
            setTopBarPreviewMode,
            getTopBarPreviewMode,
            setShouldStartPreviewController,
            setStartPreviewCallback,
            setCurrentUser,
            isPreviewMode,
            startPreivewCallback,
        } = this;
        const {
            fileName,
            selectedElem,
            hasUnsavedChange,
            shouldStartPreviewController,
            currentUser,
        } = this.state;
        return (
            <TopBarContext.Provider value={{
                updateTopBar,
                setElement,
                setFileName,
                setHasUnsavedChange,
                setTopBarPreviewMode,
                getTopBarPreviewMode,
                setShouldStartPreviewController,
                setStartPreviewCallback,
                setCurrentUser,
                isPreviewMode,
                startPreivewCallback,
                fileName,
                selectedElem,
                hasUnsavedChange,
                shouldStartPreviewController,
                currentUser,
            }}>
                {this.props.children}
            </TopBarContext.Provider>
        );
    }
};

export default { TopBarContextProvider, TopBarContext };
