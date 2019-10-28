define([
    'react',
    'reactDOM',
    'jsx!widgets/Modal',
    'app/stores/beambox-store',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'helpers/i18n'
], function(
    React,
    ReactDOM,
    Modal,
    BeamboxStore,
    ProgressActions,
    ProgressConstants,
    i18n
) {
    const LANG = i18n.lang.topmenu;
    
    class NounProjectPanel extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                show: false,
                mode: 'search',
                term: '',
                page: 0
            };
            const key = '3756822123b24cdfb9b9b2107ba3d30c';
            const secret = '41f7b6d0575d4d0f8a3abecf70e6216c';
            this.key = key;
            this.secret = secret;
            this.oauth = {
                consumer_key: this.key || '',
                consumer_secret: this.secret || ''
            }
            this.resultIcons =  [];
            this.hasNext = false;
        }

        componentDidMount() {
            BeamboxStore.onShowNounProjectPanel(this._show.bind(this));

        }

        componentWillUnmount() {
        }

        _show() {
            this.setState({
                show: true
            });
        }

        _close() {
            this.setState({
                show: false,
                mode: 'search',
                page: 0
            });
        }

        _getIconsByTerm(term, page, callback) {
            ProgressActions.open(ProgressConstants.NONSTOP, 'Loading From Noun Project');
            const request = require('request');
            const offset = 48 * page;
            console.log(`http://api.thenounproject.com/icons/${term}?offset=${offset}`)
            request({
                url: encodeURI(`http://api.thenounproject.com/icons/${term}?offset=${offset}`),
                method: 'GET',
                oauth: this.oauth
            }, (error, res, data) => {
                if (error) console.error(error);
                console.log(res.statusCode);
                if (res.statusCode === 200) {
                    data = JSON.parse(data);
                    console.log(data);
                    console.log(data.icons.length > 48);
                    this.hasNext = data.icons.length > 48;
                    this.resultIcons.push(data.icons);
                } else {
                    this.hasNext = false;
                    this.resultIcons = [];
                }
                ProgressActions.close();
                callback();
            });
        }

        _searchHandler() {
            let term = ReactDOM.findDOMNode(this.refs.search_term).value;
            this.resultIcons = [];
            this._getIconsByTerm(term, 0, () => {
                this.setState({
                    mode: 'search',
                    term: term,
                    page: 0
                });
            });
        }

        _renderContent() {
            switch(this.state.mode) {
                case 'search':
                    return this._renderSearchResult();
                    break;
                case 'preview':
                    return this._renderPreview();
                    break;
                default:
                    return;
            }
        }

        _renderSearchResult() {
            if (this.resultIcons.length > 0) {
                let icons = [];
                for (let i = 0; i < Math.min(48, this.resultIcons[this.state.page].length); i++) {
                    icons.push(
                        <div className="icon-cell" key={i} onClick={() => {this._toPreview(i)}}>
                            <img src={this.resultIcons[this.state.page][i].preview_url_84}/>
                        </div>
                    );
                }
                return (
                    <div className='icons-layout-container'>
                        <div className='icons-layout'>
                            {icons}
                        </div>
                    </div>
                );
            } else {
                let text
                if (this.state.term) {
                    text = `We didn't find any icons for "${this.state.term}"`
                } else {
                    text = `Try search for something`
                }
                return (
                    <div className='icons-layout-container'>
                        <div className='no-icon-results'>
                            <div>
                                {text}
                            </div>
                        </div>
                    </div>
                );
            }
        }

        _toPreview(i) {
            this.setState({
                mode: 'preview',
                previewId: i
            })
        }

        _renderPreview() {
            return (
                <div className='icon-preview'>
                    <img src={this.resultIcons[this.state.page][this.state.previewId].preview_url} />
                </div>
            );
        }

        _renderFooter() {
            let buttons = [];
            buttons.push(
                <button className='btn btn-default pull-left' key = 'cancel'
                    onClick={() => {this._close()}}
                >{'Cancel'}
                </button>);
            
            switch(this.state.mode) {
                case 'search':
                    let prev = this.state.page > 0 ? '' : 'hide';
                    let next = this.hasNext ? '' : 'hide';
                    buttons.push(
                        <button className={`btn btn-default pull-right ${next}`} key = 'next'
                        onClick={() => {
                            if (this.hasNext) {
                                this._handleNext();
                            }
                        }}
                        >{'Next'}
                        </button>
                    );
                    buttons.push(
                        <button className={`btn btn-default pull-right ${prev}`} key = 'prev'
                        onClick={() => {
                            if (this.state.page > 0) {
                                this._handlePrev();
                            }
                        }}
                        >{'Prev'}
                        </button>
                    );
                    break;
                case 'preview':
                    buttons.push(
                        <button className='btn btn-default pull-right' key = 'insert'
                        onClick={() => {this._insert()}}
                        >{'Insert'}
                        </button>
                    );
                    buttons.push(
                        <button className='btn btn-default pull-right' key = 'back'
                        onClick={() => {this.setState({mode:'search'})}}
                        >{'Back'}
                        </button>
                    );
                default:
                    break;
            }

            return (
                <div className="footer">
                    {buttons}
                </div>
            );
        }

        _handlePrev() {
            this.setState({page: this.state.page - 1});
        }

        _handleNext() {
            console.log(this.resultIcons.length, this.state.page + 1);
            if (this.resultIcons.length === this.state.page + 1) {
                this._getIconsByTerm(this.state.term, this.state.page + 1, () => {
                    this.setState({
                        mode: 'search',
                        page: this.state.page + 1
                    });
                });
            } else {
                this.setState({page: this.state.page + 1});
            }
        }

        async _insert() {
            let icon = this.resultIcons[this.state.page][this.state.previewId];
                if (icon.icon_url) {
                    let image;
                    image = await fetch(icon.icon_url);
                    image = await image.blob();
                    svgEditor.importSvg(image);
                } else {
                    let image;
                    image = await fetch(icon.preview_url);
                    image = await image.blob();
                    svgEditor.readImage(image);
                }
            this._close();
        }

        _handleKeyDown(e) {
            if (e.key === 'Enter') {
                this._searchHandler();
            }
        }

        render() {
            if (this.state.show) {
                return (
                    <Modal onClose={() => {this._close()}}>
                        <div className='noun-project-panel'>
                            <div className='search-panel'>
                                <input type="text" id="search_term" ref="search_term" placeholder="Search..."
                                    defaultValue={this.state.term}
                                    onKeyDown={(e) => {this._handleKeyDown(e)}}>
                                </input>
                                <button
                                    className='btn btn-default pull-right'
                                    onClick={() => {this._searchHandler()}}
                                >{'Search'}
                                </button>
                            </div>
                            {this._renderContent()}
                            {this._renderFooter()}
                        </div>
                    </Modal>
                );
            } else {
                return (
                    <div></div>
                )
            }
            
        }
    };

    return NounProjectPanel;
});
