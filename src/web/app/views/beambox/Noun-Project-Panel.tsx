import Modal from '../../widgets/Modal';
import DraggableWindow from '../../widgets/Draggble-Window';
import Progress from '../../actions/progress-caller';
import LocalStorage from '../../../helpers/local-storage';
import { getSVGAsync } from '../../../helpers/svg-editor-helper';
import { IData, IIcon } from '../../../interfaces/INoun-Project';
import * as i18n from '../../../helpers/i18n';

// import EventEmitter from 'events';
const EventEmitter = requireNode('events');

let svgEditor;
getSVGAsync((globalSVG) => {
    svgEditor = globalSVG.Editor;
});

const React = requireNode('react');
const classNames = requireNode('classnames');
const LANG = i18n.lang;

const INFO_DIALOG_WIDTH = 250;
const INFO_DIALOG_HEIGHT = 60;

enum Tabs {
    LIBRARY = 0,
    HISTORY = 1,
};

interface IState {
    currentTab: Tabs,
    term: string,
    isSearching: boolean,
    hadErrorWhenSearching?: boolean,
    resultIcons: IIcon[][],
    historyIcons: IIcon[],
    highLightedIndex: number,
    hasNext: boolean,
    showInfoModal: boolean,
    infoModalX?: number,
    infoModalY?: number,
}

const searchResultCache = {};

export const NounProjectPanelController = new EventEmitter();

class NounProjectPanel extends React.Component {
    private fetchingTerm: string = '';
    private fetchedPage: number = 0;
    private state: IState;
    constructor(props) {
        super(props);
        const nounProjectHistory: IIcon[] = LocalStorage.get('noun-project-history') || [];
        this.state = {
            currentTab: Tabs.LIBRARY,
            term: '',
            isSearching: false,
            hadErrorWhenSearching: false,
            resultIcons: [],
            historyIcons: nounProjectHistory,
            highLightedIndex: -1,
            hasNext: false,
            showInfoModal: false,
            infoModalX: 0,
            infoModalY: 0,
        };
        const key = '3756822123b24cdfb9b9b2107ba3d30c';
        const secret = '41f7b6d0575d4d0f8a3abecf70e6216c';
        this.oauth = {
            consumer_key: key,
            consumer_secret: secret,
        };
        this.scrollPosition = {};
        this.searchInput = React.createRef();
        this.contentContainer = React.createRef();
    }

    componentDidMount() {
        NounProjectPanelController.on('insertIcon', (icon: IIcon) => this.handleInsert(icon));
    }

    componentWillUnmount() {
        NounProjectPanelController.removeAllListeners();
    }

    renderTabs() {
        const { currentTab } = this.state;
        const changeTab = (tab: Tabs) => {
            if (tab !== currentTab) {
                this.scrollPosition[currentTab] = this.contentContainer.current.scrollTop;
                this.setState({
                    highLightedIndex: -1,
                    currentTab: tab,
                }, () => {
                    this.contentContainer.current.scrollTop = this.scrollPosition[tab];
                });
            }
        }
        return (
            <div className='tabs'>
                <div className={classNames('tab', { active: currentTab === Tabs.LIBRARY })} onClick={() => changeTab(Tabs.LIBRARY)}>{'Library'}</div>
                <div className={classNames('tab', { active: currentTab === Tabs.HISTORY })} onClick={() => changeTab(Tabs.HISTORY)}>{'History'}</div>
            </div>
        );
    }

    renderHeader() {
        const { currentTab } = this.state;
        if (currentTab === Tabs.LIBRARY) {
            return this.renderSearchInput();
        } else {
            return null;
        }
    }

    renderSearchInput() {
        const { term } = this.state;
        return (
            <div className='search-panel'>
                <img className='search-icon' src='img/noun-project-panel/icon-search.svg' draggable='false'/>
                <input type='text' id='search-input' ref={this.searchInput} placeholder='Search for anything'
                    defaultValue={term}
                    onKeyDown={(e: KeyboardEvent) => {this.handleSearchInputKeyDown(e)}}
                >
                </input>
                <div className={classNames('cancel-button', { hide: term === ''})} onClick={() => this.onCancelSearch()}>
                    <img src='img/icon-clear.svg'/>
                </div>
            </div>
        );
    }

    async handleSearchInputKeyDown(e: KeyboardEvent) {
        e.stopPropagation();
        if (e.key === 'Enter') {
            this.handleSearch();
        }
    }

    async handleSearch() {
        let searchingTerm = this.searchInput.current.value;
        const { term, hadErrorWhenSearching } = this.state;

        if (term === searchingTerm && !hadErrorWhenSearching) return;

        if (searchingTerm in searchResultCache) {
            this.getIconsFromCache(searchingTerm);
            return;
        }

        this.setState({
            term: '',
            isSearching: true,
            hadErrorWhenSearching: false,
            resultIcons: [],
            highLightedIndex: -1,
        });
        const resultIcons = [];
        try {
            const newData = await this.getIconsByTerm(searchingTerm, 0);
            let hasNext = false;
            if (newData) {
                resultIcons.push(newData.icons);
                if (newData.icons.length > 48) {
                    hasNext = true;
                }
            }
            this.contentContainer.current.scrollTop = 0;
            this.setState({
                term: searchingTerm,
                isSearching: false,
                resultIcons,
                hasNext,
            }, () => {
                setTimeout(() => {
                    this.contentContainer.current.scrollTop = 0;
                }, 30); 
            });
        } catch (e) {
            console.log(e.message);
            console.log(`Error when search ${searchingTerm}`, e);
            this.setState({
                term: searchingTerm,
                isSearching: false,
                hadErrorWhenSearching: true,
                hasNext: false,
            })
        }
    }

    getIconsFromCache(term: string) {
        const resultIcons = [...searchResultCache[term]] as IIcon[][];
        const hasNext = resultIcons[resultIcons.length - 1].length > 48;
        this.fetchedPage = resultIcons.length - 1;
        this.fetchingTerm = term;
        this.contentContainer.current.scrollTop = 0;
        this.setState({
            term,
            resultIcons,
            highLightedIndex: -1,
            hasNext,
        });
    }

    getIconsByTerm(term: string, page: number) {
        if (term === this.fetchingTerm && page <= this.fetchedPage) {
            return;
        }

        // Warning: This module will call define. Declaring this at top of file would cause requirejs loading error.
        const request = requireNode('request');
        this.fetchingTerm = term;
        this.fetchedPage = page;
        return new Promise<IData>((resolve, reject) => {
            // Progress.openNonstopProgress({ id:'noun-project', message: 'Loading From Noun Project' });
            const offset = 48 * page;
            console.log(`http://api.thenounproject.com/icons/${term}?offset=${offset}`);
            request({
                url: encodeURI(`http://api.thenounproject.com/icons/${term}?offset=${offset}`),
                method: 'GET',
                oauth: this.oauth,
                timeout: 10000,
            }, (error, res, data) => {
                if (error) {
                    this.fetchedPage = page - 1;
                    reject(error);
                };
                if (res && res.statusCode === 200) {
                    data = JSON.parse(data);
                    if (!searchResultCache[term]) {
                        searchResultCache[term] = [];
                    }
                    searchResultCache[term][page] = data.icons;
                    console.log(searchResultCache);
                    resolve(data);
                } else {
                    this.fetchedPage = page - 1;
                    resolve(null);
                }
                // Progress.popById('noun-project');
            });
        });
    }

    getIconById(id: string) {
        // Warning: This module will call define. If declare this at top of file will cause requirejs loading error.
        const request = requireNode('request');
        return new Promise<IIcon>((resolve, reject) => {
            console.log(`http://api.thenounproject.com/icon/${id}`);
            request({
                url: encodeURI(`http://api.thenounproject.com/icon/${id}`),
                method: 'GET',
                oauth: this.oauth,
                timeout: 10000,
            }, (error, res, data) => {
                if (error) {
                    reject(error);
                };
                if (res && res.statusCode === 200) {
                    data = JSON.parse(data);
                    resolve(data.icon);
                } else {
                    resolve(null);
                }
            });
        })

    }

    onCancelSearch() {
        this.searchInput.current.value = '';
        this.setState({
            term: '',
            resultIcons: [],
            hadErrorWhenSearching: false,
            highLightedIndex: -1,
            hasNext: false,
        });
    }

    renderContent() {
        const { currentTab } = this.state;
        let content: HTMLElement;
        if (currentTab === Tabs.LIBRARY) {
            content = this.renderLibraryContent();
        } else if (currentTab === Tabs.HISTORY) {
            content = this.renderHistoryContent();
        }

        return (
            <div
                className={classNames('content-container', {'no-header': currentTab === Tabs.HISTORY})}
                ref={this.contentContainer}
                onScroll={(e: UIEvent) => this.onSearchResultScroll(e)}
            >
                {content}
            </div>
        );
    }

    renderLibraryContent() {
        const { isSearching, hadErrorWhenSearching, resultIcons, highLightedIndex, hasNext, term } = this.state;
        let content: HTMLElement;
        if (resultIcons.length === 0) {
            let text = '';
            if (isSearching) {
            } else if (hadErrorWhenSearching) {
                text = `Error occured when search "${term}", click to retry`; 
            } else if (term) {
                text = `We didn't find any icons for "${term}"`;
            } else {
                text = 'Try search for something';
            }
            content = (
                <div className='no-icon-results'>
                    <div onClick={hadErrorWhenSearching ? () => this.handleSearch() : null} className={classNames({'spinner-roller': isSearching})}>
                        {text}
                    </div>
                </div>
            );
        } else {
            let icons = [];
            console.log(resultIcons);
            for (let i = 0; i < resultIcons.length; i++) {
                for (let j = 0; j < Math.min(48, resultIcons[i].length); j++) {
                    const index = i * 48 + j;
                    icons.push(this.renderIconCell(index, resultIcons[i][j], highLightedIndex === index));
                }
            }
            content = (
                <div className='icons-list' onClick={() => this.onHighlight(-1)}>
                    {icons}
                    {hasNext ?
                        <div className='loading-placeholder'>
                            <div className='dot-flashing'/>
                        </div>
                        :
                        null
                    }
                </div>
            );
        }

        return content;
    }

    renderHistoryContent() {
        const { historyIcons, highLightedIndex } = this.state;
        let icons = [];
        for (let i = 0; i < historyIcons.length; i++) {
            const reversedIndex = historyIcons.length - i - 1;
            icons.push(this.renderIconCell(i, historyIcons[reversedIndex], highLightedIndex === i));
        }
        return (
            <div className='icons-list' onClick={() => this.onHighlight(-1)}>
                {icons}
            </div>
        );
    }

    handleNext = async () => {
        const { term, resultIcons } = this.state;
        let hasNext = false;
        try {
            const newData = await this.getIconsByTerm(term, resultIcons.length);
            if (newData) {
                resultIcons.push(newData.icons);
                if (newData.icons.length > 48) {
                    hasNext = true;
                }
            }
            this.setState({ resultIcons, hasNext });
        } catch(e) {
            console.error('When handling next:\n',e);
            console.log('Retry in 0.3s');
            setTimeout(() => {
                this.handleNext();
            }, 300);
        }
    }

    renderIconCell(index: number, icon: IIcon, isHighlighted: boolean) {
        return (
            <div
                className={classNames('icon-cell', { highlight: isHighlighted })}
                key={icon.id}
                onClick={(e: MouseEvent) => {
                    e.stopPropagation();
                    this.onHighlight(index);
                }}
                onDoubleClick={() => this.handleInsert(icon)}
                onDragStart={(e: DragEvent) => this.onIconDragStart(e, icon)}
            >
                <img src={icon.preview_url_84}/>
            </div>
        )
    }

    onHighlight(index: number) {
        const { highLightedIndex } = this.state;
        if (index !== highLightedIndex) {
            this.setState({ highLightedIndex: index });
        }
    }

    async handleInsert(icon: IIcon) {
        try {
            console.log(icon);
            if (icon.icon_url) {
                console.log(icon.icon_url);
                const expireTime = Number(/\?Expires=(\d+)/.exec(icon.icon_url)[1]);
                if (Date.now() / 1000 > expireTime) {
                    const updatedIcon = await this.getIconById(icon.id);
                    console.log(updatedIcon);
                    Object.assign(icon, updatedIcon);
                }
                const response = await fetch(icon.icon_url);
                console.log(response);
                const blob = await response.blob();
                svgEditor.importSvg(blob, {
                    isFromNounProject: true,
                });
            } else {
                const response = await fetch(icon.preview_url);
                const blob = await response.blob();
                svgEditor.readImage(blob);
            }
        } catch (e) {
            console.log(e);
        }
        this.addToHistory(icon);
    }

    addToHistory(icon: IIcon) {
        const { historyIcons, currentTab, highLightedIndex } = this.state;
        for (let i = 0; i < historyIcons.length; i++) {
            if (historyIcons[i].id === icon.id) {
                historyIcons.splice(i, 1);
                break;
            }
        }
        historyIcons.push(icon);
        if (historyIcons.length > 50) {
            historyIcons.splice(0, 1);
        }
        LocalStorage.set('noun-project-history', historyIcons);

        this.setState({
            historyIcons,
            highLightedIndex: currentTab === Tabs.HISTORY ? 0 : highLightedIndex,
        });
    }

    onIconDragStart(e: DragEvent, icon: IIcon) {
        const dt = e.dataTransfer;
        dt.setData('text/noun-project-icon', JSON.stringify(icon));
    }

    async onSearchResultScroll(e: UIEvent) {
        const { resultIcons, isSearching, hasNext } = this.state;
        if (!hasNext || isSearching || resultIcons.length <= this.fetchedPage) return;
        const eventTarget = e.target as HTMLElement;
        if (eventTarget.scrollTop + eventTarget.offsetHeight >= eventTarget.scrollHeight - 80) {
            console.log('fetching new icon', resultIcons.length);
            await this.handleNext();
        }
    }

    getHighlightedIcon() {
        const { highLightedIndex, resultIcons, historyIcons, currentTab } = this.state;
        let highLightedIcon: IIcon = null;
        if (highLightedIndex >= 0) {
            if (currentTab === Tabs.LIBRARY) {
                const page = Math.floor(highLightedIndex / 48);
                const index = highLightedIndex % 48;
                highLightedIcon = resultIcons[page][index];
            } else if (currentTab === Tabs.HISTORY) {
                const reversedIndex = historyIcons.length - highLightedIndex - 1;
                highLightedIcon = historyIcons[reversedIndex];
            }
        }
        return highLightedIcon;
    }

    renderFooter() {
        const highLightedIcon = this.getHighlightedIcon();

        return (
            <div className='footer'>
                <div className={classNames('term')}>
                    {highLightedIcon ? highLightedIcon.term : ''}
                </div>
                <div className={classNames('info', { disabled: !highLightedIcon })} title={'info'} onClick={(e: MouseEvent) => this.onInfoClick(e)}>
                    <img className='search-icon' src={`img/icon-info.svg`} draggable='false'/>
                </div>
            </div>
        );
    }

    onInfoClick(e: MouseEvent) {
        this.setState({ showInfoModal: true, infoModalX: e.clientX, infoModalY: e.clientY });
    }

    renderInfoModal() {
        const { showInfoModal, infoModalX, infoModalY } = this.state;
        if (!showInfoModal) return;
        const highLightedIcon = this.getHighlightedIcon();
        if (!highLightedIcon) return;
        const infoWindowStyle: {left?: number, right?: number, top?: number, bottom?: number} = {};
        if (innerWidth - infoModalX > INFO_DIALOG_WIDTH) {
            infoWindowStyle.left = infoModalX;
        } else {
            infoWindowStyle.right = innerWidth - infoModalX;
        }
        if (innerHeight - infoModalY > INFO_DIALOG_HEIGHT) {
            infoWindowStyle.top = infoModalY;
        } else {
            infoWindowStyle.bottom = innerHeight - infoModalY;
        }
        return (
            <Modal onClose={() => this.setState({ showInfoModal: false })}>
                <div className={classNames('info-window')} style={infoWindowStyle}>
                    <div className={classNames('term')}>{`Name: ${highLightedIcon.term}`}</div>
                    <div className={classNames('id')}>{`ID: ${highLightedIcon.id}`}</div>
                    <div className={classNames('author')}>{`Author: ${highLightedIcon.uploader.name}`}</div>
                </div>
            </Modal>
        );
    }

    render() {
        const { onClose } = this.props;
        return (
            <div className={classNames('noun-project-panel-container')}>
                <DraggableWindow
                    title='Shape Library'
                    containerClass={classNames('noun-project-panel')}
                    defaultPosition={{x: 50, y: 50}}
                    onClose={() => onClose()}
                >
                    <div>
                        {this.renderTabs()}
                        {this.renderHeader()}
                        {this.renderContent()}
                        {this.renderFooter()}
                    </div>
                </DraggableWindow>
                {this.renderInfoModal()}
            </div>
        );
    }
};

export default NounProjectPanel;
