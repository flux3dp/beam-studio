import * as React from 'react';
import classNames from 'classnames';
import EventEmitter from 'eventemitter3';

import defaultIcons from 'app/constants/noun-project-constants';
import DraggableWindow from 'app/widgets/DraggableWindow';
import i18n from 'helpers/i18n';
import importSvg from 'app/svgedit/operations/import/importSvg';
import Modal from 'app/widgets/Modal';
import readBitmapFile from 'app/svgedit/operations/import/readBitmapFile';
import storage from 'implementations/storage';
import { fluxIDEvents, getNPIconByID, getNPIconsByTerm } from 'helpers/api/flux-id';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { IIcon } from 'interfaces/INoun-Project';

let svgEditor;
getSVGAsync((globalSVG) => {
  svgEditor = globalSVG.Editor;
});

const LANG = i18n.lang.noun_project_panel;

const INFO_DIALOG_WIDTH = 250;
const INFO_DIALOG_HEIGHT = 60;

enum Tabs {
  LIBRARY = 0,
  HISTORY = 1,
}

interface State {
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

let cacheTotalLength = 0;
const searchResultCache = {};
const searchTermHistory: string[] = [];
const CACHE_SIZE_LIMIT = 20;

const updateCache = (icons: IIcon[], term: string, page: number) => {
  const addToCache = (icons: IIcon[], term: string, page: number) => {
    if (!searchResultCache[term]) {
      searchResultCache[term] = [];
    }
    if (page >= searchResultCache[term].length) {
      cacheTotalLength += 1;
    }
    searchResultCache[term][page] = icons;
  }

  const updateTermHistory = (term: string) => {
    const index = searchTermHistory.findIndex((t) => t === term);
    if (index >= 0) {
      searchTermHistory.splice(index, 1);
    }
    searchTermHistory.push(term);
  };

  const checkAndClearOversizedCache = () => {
    if (cacheTotalLength > CACHE_SIZE_LIMIT) {
      if (searchTermHistory.length > 1) {
        const oldestTerm = searchTermHistory.shift();
        cacheTotalLength -= searchResultCache[oldestTerm].length;
        delete searchResultCache[oldestTerm];
      }
    }
  };

  addToCache(icons, term, page);
  updateTermHistory(term);
  checkAndClearOversizedCache();
}

export const NounProjectPanelController = new EventEmitter();

interface Props {
  onClose: () => void;
}

class NounProjectPanel extends React.Component<Props, State> {
  private fetchingTerm = '';

  private fetchedPage = 0;

  private scrollPosition: any;

  private searchInput: React.RefObject<HTMLInputElement>;

  private contentContainer: React.RefObject<HTMLDivElement>;

  constructor(props) {
    super(props);
    const nounProjectHistory: IIcon[] = storage.get('noun-project-history') || [];
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
    this.scrollPosition = {};
    this.searchInput = React.createRef();
    this.contentContainer = React.createRef();
  }

  componentDidMount() {
    fluxIDEvents.on('logged-out', this.props.onClose);
    NounProjectPanelController.on('insertIcon', (icon: IIcon) => this.handleInsert(icon));
  }

  componentWillUnmount() {
    fluxIDEvents.removeListener('logged-out', this.props.onClose);
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
      <div className="tabs">
        <div className={classNames('tab', { active: currentTab === Tabs.LIBRARY })} onClick={() => changeTab(Tabs.LIBRARY)}>{LANG.elements}</div>
        <div className={classNames('tab', { active: currentTab === Tabs.HISTORY })} onClick={() => changeTab(Tabs.HISTORY)}>{LANG.recent}</div>
      </div>
    );
  }

  renderHeader() {
    const { currentTab } = this.state;
    if (currentTab === Tabs.LIBRARY) {
      return this.renderSearchInput();
    }
    return null;
  }

  renderSearchInput() {
    const { term } = this.state;
    return (
      <div className="search-panel">
        <img className="search-icon" src="img/noun-project-panel/icon-search.svg" draggable="false" />
        <input type="text" id="search-input" ref={this.searchInput} placeholder={LANG.search}
          defaultValue={term}
          onKeyDown={(e: React.KeyboardEvent) => this.handleSearchInputKeyDown(e)}
        />
        <div className={classNames('cancel-button', { hide: term === '' })} onClick={() => this.onCancelSearch()}>
          <img src="img/icon-clear.svg" title={LANG.clear} />
        </div>
      </div>
    );
  }

  async handleSearchInputKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation();
    if (e.key === 'Enter') {
      this.handleSearch();
    }
  }

  async handleSearch() {
    let searchingTerm = this.searchInput.current.value;
    const { term, hadErrorWhenSearching } = this.state;

    if (!searchingTerm || term === searchingTerm && !hadErrorWhenSearching) return;
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
    try {
      const resultIcons = [];
      const icons = await this.getIconsByTerm(searchingTerm, 0);
      let hasNext = false;
      if (icons) {
        resultIcons.push(icons);
        if (icons.length > 48) {
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
      });
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

  async getIconsByTerm(term: string, page: number) {
    if (term === this.fetchingTerm && page <= this.fetchedPage) {
      return;
    }

    this.fetchingTerm = term;
    this.fetchedPage = page;
    const data = await getNPIconsByTerm(term, page * 48);
    if (!data || data.status !== 'ok') {
      const message = data.message ? `${data.info}: ${data.message}` : data.info;
      throw message || 'Failed to get icons';
    }
    updateCache(data.icons, term, page);
    return data.icons;
  }

  async getIconById(id: string) {
    const data = await getNPIconByID(id);
    if (!data || data.status !== 'ok') {
      const message = data.message ? `${data.info}: ${data.message}` : data.info;
      throw message || 'Failed to get icons';
    }
    return data.icon;
  }

  onCancelSearch() {
    this.searchInput.current.value = '';
    this.setState({
      term: '',
      resultIcons: [],
      hadErrorWhenSearching: false,
      highLightedIndex: -1,
      hasNext: false,
    }, () => {
      this.scrollPosition[Tabs.LIBRARY] = 0;
      this.contentContainer.current.scrollTop = 0;
    });
  }

  renderContent() {
    const { currentTab } = this.state;
    let content: JSX.Element;
    if (currentTab === Tabs.LIBRARY) {
      content = this.renderLibraryContent();
    } else if (currentTab === Tabs.HISTORY) {
      content = this.renderHistoryContent();
    }

    return (
      <div
        className={classNames('content-container', { 'no-header': currentTab === Tabs.HISTORY })}
        ref={this.contentContainer}
        onScroll={(e: React.UIEvent) => this.onSearchResultScroll(e)}
      >
        {content}
      </div>
    );
  }

  renderLibraryContent() {
    const { isSearching, hadErrorWhenSearching, resultIcons, hasNext, term } = this.state;
    if (isSearching) {
      return this.renderSearchingContent();
    } else if (term === '') {
      return this.renderIconList(defaultIcons, false);
    } else if (resultIcons.length === 0) {
      if (isSearching) {
      } else if (hadErrorWhenSearching) {
        return this.renderSearchError();
      }
      return this.renderSearchNoResult();
    }
    console.log(resultIcons);
    const icons = [];
    resultIcons.forEach((result) => {
      icons.push(...result.slice(0, 48));
    });
    return this.renderIconList(icons, hasNext);
  }

  renderHistoryContent() {
    const { historyIcons } = this.state;
    return this.renderIconList([...historyIcons].reverse(), false);
  }

  renderSearchingContent() {
    return this.renderNoIconContent('', classNames('spinner-roller'));
  }

  renderSearchError() {
    const { term } = this.state;
    return this.renderNoIconContent(`Error occured when search "${term}", click to retry`, '', () => this.handleSearch());
  }

  renderSearchNoResult() {
    const { term } = this.state;
    return this.renderNoIconContent(`We didn't find any icons for "${term}"`);
  }

  renderNoIconContent(text: string, className: string = '', onClick: React.MouseEventHandler = null) {
    return (
      <div className='no-icon-results'>
        <div className={className} onClick={onClick}>
          {text}
        </div>
      </div>
    );
  }

  renderIconList(icons: IIcon[], hasNext: boolean) {
    const { highLightedIndex } = this.state;
    const iconCells = [];
    for (let i = 0; i < icons.length; i++) {
      iconCells.push(this.renderIconCell(i, icons[i], highLightedIndex === i));
    }
    let loadingIndicator = hasNext ? (
      <div className='loading-placeholder'>
        <div className='dot-flashing' />
      </div>
    ) : null;

    return (
      <div className='icons-list' onClick={() => this.onHighlight(-1)}>
        {iconCells}
        {loadingIndicator}
      </div>
    );
  }

  handleNext = async () => {
    const { term, resultIcons } = this.state;
    let hasNext = false;
    try {
      const icons = await this.getIconsByTerm(term, resultIcons.length);
      if (icons) {
        resultIcons.push(icons);
        if (icons.length > 48) {
          hasNext = true;
        }
      }
      this.setState({ resultIcons, hasNext });
    } catch (e) {
      console.error('When handling next:\n', e);
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
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          this.onHighlight(index);
        }}
        onDoubleClick={() => this.handleInsert(icon)}
        onDragStart={(e: React.DragEvent) => this.onIconDragStart(e, icon)}
      >
        <img src={icon.preview_url_84} />
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
        importSvg(blob, {
          isFromNounProject: true,
        });
      } else {
        const response = await fetch(icon.preview_url);
        const blob = await response.blob();
        readBitmapFile(blob);
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
    storage.set('noun-project-history', historyIcons);

    this.setState({
      historyIcons,
      highLightedIndex: currentTab === Tabs.HISTORY ? 0 : highLightedIndex,
    });
  }

  onIconDragStart(e: React.DragEvent, icon: IIcon) {
    const dt = e.dataTransfer;
    dt.setData('text/noun-project-icon', JSON.stringify(icon));
  }

  async onSearchResultScroll(e: React.UIEvent) {
    const { resultIcons, isSearching, hasNext } = this.state;
    if (!hasNext || isSearching || resultIcons.length <= this.fetchedPage) return;
    const eventTarget = e.target as HTMLElement;
    if (eventTarget.scrollTop + eventTarget.offsetHeight >= eventTarget.scrollHeight - 80) {
      console.log('fetching new icon', resultIcons.length);
      await this.handleNext();
    }
  }

  getHighlightedIcon() {
    const { highLightedIndex, term, resultIcons, historyIcons, currentTab } = this.state;
    let highLightedIcon: IIcon = null;
    if (highLightedIndex >= 0) {
      if (currentTab === Tabs.LIBRARY) {
        if (term === '') {
          highLightedIcon = defaultIcons[highLightedIndex];
        } else {
          const page = Math.floor(highLightedIndex / 48);
          const index = highLightedIndex % 48;
          highLightedIcon = resultIcons[page][index];
        }
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
        <div className={classNames('info', { disabled: !highLightedIcon })} title={'info'} onClick={(e: React.MouseEvent) => this.onInfoClick(e)}>
          <img className='search-icon' src={`img/icon-info.svg`} draggable='false' />
        </div>
      </div>
    );
  }

  onInfoClick(e: React.MouseEvent) {
    this.setState({ showInfoModal: true, infoModalX: e.clientX, infoModalY: e.clientY });
  }

  renderInfoModal() {
    const { showInfoModal, infoModalX, infoModalY } = this.state;
    if (!showInfoModal) return;
    const highLightedIcon = this.getHighlightedIcon();
    if (!highLightedIcon) return;
    const infoWindowStyle: { left?: number, right?: number, top?: number, bottom?: number } = {};
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
          title={LANG.shapes}
          containerClass={classNames('noun-project-panel')}
          defaultPosition={{ x: 50, y: 50 }}
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
