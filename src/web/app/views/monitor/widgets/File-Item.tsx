const React = requireNode('react');
const classNames = requireNode('classnames');

import { ItemType } from 'app/constants/monitor-constants';
import { MonitorContext } from 'app/contexts/Monitor-Context';

const maxFileNameLength = 12;
const DEFAULT_IMAGE = 'img/ph_s.png';

export default class FileItem extends React.Component {
    constructor(props) {
        super(props);
        this.imgSrc = null;
        const { fileInfo } = this.props;
        this.createImgURL(fileInfo);
    }

    componentWillUnmount() {
        this.revokeImgURL();
    }

    shouldComponentUpdate(nextProps) {
        for (let key in nextProps) {
            if (nextProps[key] !== this.props[key]) {
                if (key === 'fileInfo') {
                    const { fileInfo } = nextProps;
                    this.revokeImgURL();
                    this.createImgURL(fileInfo);
                }
                return true;
            }
        }
        return false;
    }

    createImgURL(fileInfo) {
        if (fileInfo && fileInfo[2] instanceof Blob) {
            this.imgSrc = URL.createObjectURL(fileInfo[2]);
        }
    }

    revokeImgURL() {
        if (this.imgSrc) {
            URL.revokeObjectURL(this.imgSrc);
            this.imgSrc = null;
        }
    }

    onImageError(evt) {
        evt.target.src = 'img/ph_s.png';
    }

    render() {
        const { imgSrc } = this;
        const { onHighlightItem, onSelectFile, onDeleteFile } = this.context;
        const { fileName, fileInfo, isSelected } = this.props;
        const fileNameClass = classNames('name', {'selected': isSelected});
        const iNameClass = classNames('fa', 'fa-times-circle-o', {'selected': isSelected});
        return (
            <div
                title={fileName}
                className="file"
                data-test-key={fileName}
                data-filename={fileName}
                onClick={() => onHighlightItem({ name: fileName, type: ItemType.FILE })}
                onDoubleClick={() => onSelectFile(fileName, fileInfo)}>
                <div className="image-wrapper">
                    <img src={imgSrc || DEFAULT_IMAGE} onError={this._imageError}/>
                    <i className={iNameClass}
                        onClick={onDeleteFile}></i>
                </div>
                <div className={fileNameClass}>
                    {fileName.length > maxFileNameLength ? fileName.substring(0, maxFileNameLength) + '...' : fileName}
                </div>
            </div>
        );
    }
};

FileItem.contextType = MonitorContext;
