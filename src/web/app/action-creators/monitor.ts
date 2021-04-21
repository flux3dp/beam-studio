import C from '../constants/action-creator-monitor';
import GC from '../constants/global-constants';

const changeMode = (mode) => ({
    type: C.CHANGE_MODE,
    mode,
});

const changePath = (path, content) => ({
    type: C.CHANGE_PATH,
    mode: GC.FILE,
    path,
    folderContent: content,
    isWaiting: false,
});

const updateFoldercontent = (content) => ({
    type: C.UPDATE_FOLDER_CONTENT,
    folderContent: content,
    mode: GC.FILE,
    isWaiting: false,
});

const previewFile = (info) => ({
    type: C.PREVIEW_FILE,
    mode: GC.FILE_PREVIEW,
    selectedFileInfo: info,
});

const selectItem = (item) => ({
    type: C.SELECT_ITEM,
    selectedItem: item,
});

const setDownloadProgress = (progress) => ({
    type: C.SET_DOWNLOAD_PROGRESS,
    downloadProgress: progress,
});

const setUploadProgress = (progress) => ({
    type: C.SET_UPLOAD_PROGRESS,
    uploadProgress: progress,
});

const showWait = () => ({
    type: C.SHOW_WAIT,
    isWaiting: true,
});

const closeWait = () => ({
    type: C.CLOSE_WAIT,
    isWaiting: false,
});

const setCameraOffset = (cameraOffset) => ({
    type: C.SET_CAMERA_OFFSET,
    cameraOffset,
});

const setMaintainMoving = () => ({
    type: C.SET_MAINTAIN_MOVING,
    isMaintainMoving: true,
});

const setCurrentPosition = (currentPosition) => ({
    type: C.SET_CURRENT_POSITION,
    isMaintainMoving: false,
    currentPosition,
});

const setRelocateOrigin = (relocateOrigin) => ({
    type: C.SET_RELOCATE_ORIGIN,
    relocateOrigin,
});

export default {
    changeMode,
    changePath,
    updateFoldercontent,
    previewFile,
    selectItem,
    setDownloadProgress,
    setUploadProgress,
    showWait,
    closeWait,
    setCameraOffset,
    setMaintainMoving,
    setCurrentPosition,
    setRelocateOrigin,
};
