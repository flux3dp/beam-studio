import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type { MainType, SubType } from '@core/app/constants/element-panel-constants';
import Elements, {
  ContentType,
  generateFileNameArray,
  MainTypes,
  SearchKeyMap,
  SearchMap,
  SubTypeSearchKeyMap,
} from '@core/app/constants/element-panel-constants';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { setStorage, useStorageStore } from '@core/app/stores/storageStore';
import { getCurrentUser, getNPIconsByTerm } from '@core/helpers/api/flux-id';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import type { IIcon } from '@core/interfaces/INounProject';
import type { IUser } from '@core/interfaces/IUser';

/**
 * Represents the content state, including builtin icons and Noun Project icons.
 */
export interface Content {
  /**
   * Unique identifier assigned during updateContent.
   * Used to prevent rendering outdated content after API responses.
   */
  contentId?: number;
  /**
   * Paths or file names of builtin icons.
   */
  fileNames?: string[];
  /**
   * Whether Noun Project icons are being fetched and a loading skeleton should be displayed.
   */
  loading?: boolean;
  /**
   * Folder name of builtin icons.
   *
   * When undefined, fileNames should contain full paths including the folder name.
   */
  mainType?: MainType;
  /**
   * Query token for fetching the next page from the Noun Project API.
   */
  nextPage?: string;
  /**
   * Retrieved data of Noun Project icons.
   */
  npIcons?: IIcon[];
  /**
   * Label key for sub type.
   */
  subType?: SubType;
  /**
   * Term used as the React key and the search query for the Noun Project API.
   */
  term: string;
}

export interface History {
  npIcon?: IIcon;
  path?: { fileName: string; folder: string };
  type: 'builtin' | 'np';
}

interface ICache {
  [ContentType.MainType]: { [key in SubType]?: Content };
  [ContentType.Search]: { [key: string]: Content };
  [ContentType.SubType]: { [key in SubType]?: Content };
}

const previewCount = 12;

interface ElementPanelStore {
  // UI State
  activeMainType: MainType;
  activeSubType: SubType | undefined;
  // Actions
  addToHistory: (history: History) => void;
  // Internal State (replaces refs)
  cache: ICache;

  closeDrawer: () => void;
  contentId: number;

  // Content State
  contents: Content[];

  contentType: ContentType;
  getNPIcons: (content: Content) => Promise<void>;
  // User State
  hasLogin: boolean;

  // Derived from canvasStore - panel is open when drawerMode === 'element-panel'
  open: boolean;
  searchKey: string | undefined;
  searchState: { term: string; timer: NodeJS.Timeout | null };
  setActiveMainType: (type: MainType) => void;
  setActiveSubType: (type: SubType | undefined) => void;
  setHasLogin: (hasLogin: boolean) => void;
  setSearchKey: (key: string | undefined) => void;
  updateContent: (contents: Content[], checkId?: boolean) => void;
  updateMainTabContents: () => void;
  updateSearchContents: (term?: string) => void;
  updateSubTypeContents: () => void;
}

const getInitialCache = (): ICache => ({
  [ContentType.MainType]: {},
  [ContentType.Search]: {},
  [ContentType.SubType]: {},
});

export const useElementPanelStore = create(
  subscribeWithSelector<ElementPanelStore>((set, get) => ({
    // Initial UI State
    activeMainType: MainTypes[0],
    activeSubType: undefined,
    addToHistory: (history) => {
      const historyIcons = (useStorageStore.getState()['elements-history'] || []).slice(0, previewCount);
      const newHistory = historyIcons.filter(
        (item: History) => item.path?.fileName !== history.path?.fileName || item.npIcon?.id !== history.npIcon?.id,
      );

      if (newHistory.length >= previewCount) {
        newHistory.pop();
      }

      newHistory.unshift(history);
      setStorage('elements-history', newHistory);
    },
    // Initial Internal State
    cache: getInitialCache(),

    closeDrawer: () => useCanvasStore.getState().setDrawerMode('none'),
    contentId: 0,

    // Initial Content State
    contents: [],

    contentType: ContentType.MainType,
    getNPIcons: async (contentObj) => {
      const { hasLogin, updateContent } = get();

      if (!hasLogin) return;

      contentObj.loading = true;
      updateContent([contentObj]);

      try {
        const resp = await getNPIconsByTerm(contentObj.term!, contentObj.nextPage);

        if (!resp) return;

        const { icons, next_page: newNextPage } = resp;

        if (!contentObj.npIcons) contentObj.npIcons = icons;
        else contentObj.npIcons.push(...icons);

        contentObj.nextPage = newNextPage;
      } finally {
        contentObj.loading = false;
        updateContent([contentObj], true);
      }
    },
    // Initial User State
    hasLogin: !!getCurrentUser(),

    // Derived from canvasStore - will be synced via subscription
    open: useCanvasStore.getState().drawerMode === 'element-panel',

    searchKey: undefined,

    searchState: { term: '', timer: null },

    setActiveMainType: (activeMainType) => set({ activeMainType }),

    setActiveSubType: (activeSubType) => set({ activeSubType }),

    setHasLogin: (hasLogin) => set({ hasLogin }),

    setSearchKey: (searchKey) => set({ searchKey }),

    updateContent: (newContents, checkId = false) => {
      const state = get();

      if (newContents.length === 0) {
        set({ contentId: state.contentId + 1, contents: newContents });

        return;
      }

      if (checkId && newContents[0].contentId && newContents[0].contentId !== state.contentId) {
        return;
      }

      const newContentId = state.contentId + 1;

      newContents[0].contentId = newContentId;
      set({ contentId: newContentId, contents: newContents });
    },

    updateMainTabContents: () => {
      const { activeMainType, cache, contentType, hasLogin, updateContent } = get();

      if (contentType !== ContentType.MainType) {
        return;
      }

      const subTypes = Object.keys(Elements[activeMainType]) as SubType[];
      const newContents: Content[] = [];

      subTypes.forEach((subType) => {
        if (cache[contentType][subType]) {
          newContents.push(cache[contentType][subType]);

          return;
        }

        const subTypeObj = Elements[activeMainType][subType]!;
        const subTypeContent: Content = { mainType: activeMainType, subType, term: subType };

        if (!hasLogin && !subTypeObj.fileNames && !subTypeObj.setting) {
          // Skip sub type with only np icons when not login
          return;
        }

        if (!subTypeObj.fileNames) {
          subTypeObj.fileNames = generateFileNameArray(subType, subTypeObj.setting);
        }

        const { fileNames, pinnedNP } = subTypeObj;

        subTypeContent.fileNames = hasLogin ? fileNames.slice(0, previewCount) : fileNames;

        if (pinnedNP && fileNames.length < previewCount) {
          subTypeContent.npIcons = pinnedNP.slice(0, previewCount - fileNames.length);
        }

        cache[contentType][subType] = subTypeContent;
        newContents.push(subTypeContent);
      });

      updateContent(newContents);
    },

    updateSearchContents: (term) => {
      const state = get();
      const { cache, contentType, getNPIcons, hasLogin, searchKey, searchState, updateContent } = state;
      const searchTerm = term ?? searchKey;

      if (contentType !== ContentType.Search) return;

      if (!searchTerm) {
        updateContent([]);

        return;
      }

      if (searchState.timer) {
        if (searchState.term === searchTerm) {
          return;
        }

        clearTimeout(searchState.timer);
      }

      searchState.term = searchTerm;
      searchState.timer = setTimeout(() => {
        searchState.timer = null;
      }, 1000);

      let content: Content = { term: searchTerm };
      let key = searchTerm.toLowerCase();

      key = SearchKeyMap[key] || key;

      if (cache[contentType][key]) {
        const { fileNames } = cache[contentType][key];

        content.fileNames = fileNames;
      } else if (SearchMap[key]) {
        const { path = [], types = [] } = SearchMap[key];

        types.forEach(([mainType, subTypes]) => {
          let resolvedSubTypes = subTypes;

          if (!resolvedSubTypes) resolvedSubTypes = Object.keys(Elements[mainType]) as SubType[];

          resolvedSubTypes.forEach((subType) => {
            const subTypeObj = Elements[mainType][subType];

            if (!subTypeObj) return;

            if (!subTypeObj.fileNames) {
              subTypeObj.fileNames = generateFileNameArray(subType, subTypeObj.setting);
            }

            path.push(...subTypeObj.fileNames.map((fileName) => `${mainType}/${fileName}`));
          });
        });
        SearchMap[key] = { path };
        content.fileNames = path;
      }

      // Overwrite cache to clear old search results
      cache[contentType][key] = content;
      updateContent([content]);

      if (hasLogin) {
        getNPIcons(cache[contentType][key]);
      }
    },

    updateSubTypeContents: () => {
      const { activeMainType, activeSubType, cache, contentType, getNPIcons, hasLogin, updateContent } = get();

      if (contentType !== ContentType.SubType || !activeSubType) {
        return;
      }

      if (cache[contentType][activeSubType]) {
        updateContent([cache[contentType][activeSubType]!]);

        return;
      }

      const term = (SubTypeSearchKeyMap[activeSubType] || activeSubType).replace('_', ' ');
      const content: Content = { mainType: activeMainType, term };
      const subTypeObj = Elements[activeMainType][activeSubType]!;

      if (!subTypeObj.fileNames) {
        subTypeObj.fileNames = generateFileNameArray(activeSubType, subTypeObj.setting);
      }

      const { fileNames, pinnedNP } = subTypeObj;

      content.fileNames = fileNames;

      if (pinnedNP) {
        content.npIcons = pinnedNP;
      }

      cache[contentType][activeSubType] = content;
      updateContent([content]);

      if (hasLogin) {
        getNPIcons(cache[contentType][activeSubType]!);
      }
    },
  })),
);

// Compute contentType based on state changes
const computeContentType = (
  searchKey: string | undefined,
  activeSubType: SubType | undefined,
  activeMainType: MainType,
): ContentType => {
  if (typeof searchKey === 'string') return ContentType.Search;

  if (activeSubType && Elements[activeMainType][activeSubType]) return ContentType.SubType;

  return ContentType.MainType;
};

// Subscribe to state changes and update contentType
useElementPanelStore.subscribe(
  (state) => [state.searchKey, state.activeSubType, state.activeMainType] as const,
  ([searchKey, activeSubType, activeMainType]) => {
    const newContentType = computeContentType(searchKey, activeSubType, activeMainType);
    const currentContentType = useElementPanelStore.getState().contentType;

    if (newContentType !== currentContentType) {
      useElementPanelStore.setState({ contentType: newContentType });
    }
  },
);

// Subscribe to contentType changes and trigger content updates
useElementPanelStore.subscribe(
  (state) => state.contentType,
  () => {
    const state = useElementPanelStore.getState();

    state.updateMainTabContents();
    state.updateSubTypeContents();
    state.updateSearchContents();
  },
);

// Subscribe to activeMainType changes
useElementPanelStore.subscribe(
  (state) => state.activeMainType,
  () => {
    useElementPanelStore.getState().updateMainTabContents();
  },
);

// Subscribe to activeSubType changes
useElementPanelStore.subscribe(
  (state) => state.activeSubType,
  () => {
    useElementPanelStore.getState().updateSubTypeContents();
  },
);

// Subscribe to hasLogin changes - clear cache and update content
useElementPanelStore.subscribe(
  (state) => state.hasLogin,
  () => {
    const state = useElementPanelStore.getState();

    // Clear MainType cache when login status changes
    state.cache[ContentType.MainType] = {};
    state.updateMainTabContents();
  },
);

// Auto-initialize flux-id event listener
const fluxIDEventEmitter = eventEmitterFactory.createEventEmitter('flux-id');
const handleUserUpdate = (user: IUser | null) => {
  useElementPanelStore.getState().setHasLogin(!!user);
};

fluxIDEventEmitter.on('update-user', handleUserUpdate);

// Initialize content on module load
useElementPanelStore.getState().updateMainTabContents();

// Sync open state from canvasStore
useCanvasStore.subscribe(
  (state) => state.drawerMode,
  (drawerMode) => {
    const isOpen = drawerMode === 'element-panel';

    if (useElementPanelStore.getState().open !== isOpen) {
      useElementPanelStore.setState({ open: isOpen });
    }
  },
);

// Helper functions for non-React access
export const closeElementPanel = () => useElementPanelStore.getState().closeDrawer();
export const openElementPanel = () => useCanvasStore.getState().setDrawerMode('element-panel');
export const getElementPanelState = () => useElementPanelStore.getState();
