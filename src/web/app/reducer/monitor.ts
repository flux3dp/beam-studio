import C from '../constants/action-creator-monitor';

let initialState = {
    mode: 'PREVIEW',
    currentPath: '',
    selectedItem: {},
    currentFolderContent: {},
    selectedFileInfo: [],
    downloadProgress: { size: '', left: ''},
    isWaiting: false,
    cameraOffset: null,
    isMaintainMoving: false,
    currentPosition: {x: 0, y: 0},
    relocateOrigin: {x: 0, y: 0},
};

/***
* State list
* mode                  : (string), monitor mode: PREVIEW, FILE, CAMERA, PRINT, FILE_PREVIEW
* currentPath           : (string), current displaying path (FILE mode)
* selectedItem          : (object), name: name of the file / folder, type: FILE / FOLDER
* currentFolderContent  : (object), current folder content: folders and files
* selectedFileInfo      : (array), array of objects contains file info, binary preview pic
* downloadProgress      : (object), download file from monitor {size, left}
* uploadProgress        : (string), uploading fcode to device, % finished. Empty if not uploading
*/

// TODO: update to object spread when available

export default (state = initialState, action) => {

    var _action = {};

    _action[C.CHANGE_MODE] = () => Object.assign({}, state, {
        mode: action.mode
    });

    _action[C.UPDATE_FOLDER_CONTENT] = () => Object.assign({}, state, {
        currentFolderContent: action.folderContent,
        mode: action.mode
    });

    _action[C.CHANGE_PATH] = () => Object.assign({}, state, {
        mode: action.mode,
        currentPath: action.path,
        currentFolderContent: action.folderContent,
        isWaiting: action.isWaiting
    });

    _action[C.PREVIEW_FILE] = () => Object.assign({}, state, {
        mode: action.mode,
        selectedFileInfo: action.selectedFileInfo,
        isWaiting: action.isWaiting
    });

    _action[C.SELECT_ITEM] = () => Object.assign({}, state, {
        selectedItem: action.selectedItem
    });

    _action[C.SET_DOWNLOAD_PROGRESS] = () => Object.assign({}, state, {
        downloadProgress: action.downloadProgress
    });

    _action[C.SET_UPLOAD_PROGRESS] = () => Object.assign({}, state, {
        uploadProgress: action.uploadProgress
    });

    _action[C.SHOW_WAIT] = () => Object.assign({}, state, {
        isWaiting: action.isWaiting
    });

    _action[C.CLOSE_WAIT] = () => Object.assign({}, state, {
        isWaiting: action.isWaiting
    });

    _action[C.SET_CAMERA_OFFSET] = () => Object.assign({}, state, {
        cameraOffset: action.cameraOffset
    });

    _action[C.SET_MAINTAIN_MOVING] = () => {return {...state, ...action}};

    _action[C.SET_CURRENT_POSITION] = () => {return {...state, ...action}};

    _action[C.SET_RELOCATE_ORIGIN] = () => {return {...state, ...action}};

    _action[C.SET_CAMERA_OFFSET] = () => Object.assign({}, state, {
        cameraOffset: action.cameraOffset
    });

    if (typeof _action[action.type] !== 'function') {
        return state;
    }

    return _action[action.type]();
};
