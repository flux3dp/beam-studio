/* eslint-disable reactRefresh/only-export-components */
import type { ReactNode } from 'react';
import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';

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
  npIcon?: IIcon; // np icon
  path?: { fileName: string; folder: string }; // builtin icon
  type: 'builtin' | 'np';
}

interface ICache {
  [ContentType.MainType]: { [key in SubType]?: Content };
  [ContentType.Search]: { [key: string]: Content };
  [ContentType.SubType]: { [key in SubType]?: Content };
}

interface ElementPanelContextType {
  activeMainType: MainType;
  activeSubType: SubType | undefined;
  addToHistory: (history: History) => void;
  cacheRef: React.MutableRefObject<ICache>;
  closeDrawer: () => void;
  contents: Content[];
  contentType: ContentType;
  getNPIcons: (contentObj: Content) => Promise<void>;
  hasLogin: boolean;
  historyIcons: History[];
  open: boolean;
  searchKey: string | undefined;
  setActiveMainType: React.Dispatch<React.SetStateAction<MainType>>;
  setActiveSubType: React.Dispatch<React.SetStateAction<SubType | undefined>>;
  setSearchKey: React.Dispatch<React.SetStateAction<string | undefined>>;
  updateSearchContents: (term?: string) => void;
}

export const ElementPanelContext = createContext<ElementPanelContextType>({
  activeMainType: MainTypes[0],
  activeSubType: undefined,
  addToHistory: () => {},
  cacheRef: { current: { [ContentType.MainType]: {}, [ContentType.Search]: {}, [ContentType.SubType]: {} } },
  closeDrawer: () => {},
  contents: [],
  contentType: ContentType.MainType,
  getNPIcons: async () => {},
  hasLogin: false,
  historyIcons: [],
  open: false,
  searchKey: undefined,
  setActiveMainType: () => {},
  setActiveSubType: () => {},
  setSearchKey: () => {},
  updateSearchContents: () => {},
});

interface ElementPanelProviderProps {
  children: React.ReactNode;
}

const previewCount = 12;

export const ElementPanelProvider = ({ children }: ElementPanelProviderProps): ReactNode => {
  const { drawerMode, setDrawerMode } = useCanvasStore();
  const [activeMainType, setActiveMainType] = useState(MainTypes[0]);
  const [activeSubType, setActiveSubType] = useState<SubType | undefined>(undefined);
  const [hasLogin, setHasLogin] = useState(!!getCurrentUser());
  const [searchKey, setSearchKey] = useState<string | undefined>(undefined);
  const [contents, setContents] = useState<Content[]>([]);
  const historyIcons = (useStorageStore((state) => state['elements-history']) || []).slice(0, previewCount);
  const cacheRef = useRef<ICache>({ [ContentType.MainType]: {}, [ContentType.Search]: {}, [ContentType.SubType]: {} });
  const searchRef = useRef({ term: '', timer: null as NodeJS.Timeout | null });
  const contentRef = useRef(0);

  useEffect(() => {
    const fluxIDEventEmitter = eventEmitterFactory.createEventEmitter('flux-id');
    const handler = (user: IUser | null) => setHasLogin(!!user);

    fluxIDEventEmitter.on('update-user', handler);

    return () => {
      fluxIDEventEmitter.removeListener('update-user', handler);
    };
  }, []);

  const updateContent = (newContents: Content[], checkId = false) => {
    if (newContents.length === 0) {
      ++contentRef.current;
      setContents(newContents);

      return;
    }

    if (checkId && newContents[0].contentId && newContents[0].contentId !== contentRef.current) {
      return;
    }

    newContents[0].contentId = ++contentRef.current;
    setContents(newContents);
  };

  const contentType = useMemo(() => {
    if (typeof searchKey === 'string') return ContentType.Search;

    if (activeSubType && Elements[activeMainType][activeSubType]) return ContentType.SubType;

    return ContentType.MainType;
  }, [activeSubType, activeMainType, searchKey]);

  const closeDrawer = () => setDrawerMode('none');

  const addToHistory = (history: History) => {
    const newHistory = historyIcons.filter(
      (item) => item.path?.fileName !== history.path?.fileName || item.npIcon?.id !== history.npIcon?.id,
    );

    if (newHistory.length >= previewCount) {
      newHistory.pop();
    }

    newHistory.unshift(history);
    setStorage('elements-history', newHistory);
  };

  const getNPIcons = async (contentObj: Content) => {
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
  };

  const updateMainTabContents = () => {
    if (contentType !== ContentType.MainType) {
      return;
    }

    const subTypes = Object.keys(Elements[activeMainType]) as SubType[];
    const newContents: Content[] = [];

    subTypes.forEach((subType) => {
      if (cacheRef.current[contentType][subType]) {
        newContents.push(cacheRef.current[contentType][subType]);

        return;
      }

      const subTypeObj = Elements[activeMainType][subType]!;
      let subTypeContent: Content = { mainType: activeMainType, subType, term: subType };

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

      cacheRef.current[contentType][subType] = subTypeContent;
      newContents.push(subTypeContent);
    });

    updateContent(newContents);
  };

  useEffect(() => {
    // Force update when login status changes
    cacheRef.current[ContentType.MainType] = {};
    updateMainTabContents();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [hasLogin]);

  // eslint-disable-next-line hooks/exhaustive-deps
  useEffect(updateMainTabContents, [activeMainType]);

  const updateSubTypeContents = () => {
    if (contentType !== ContentType.SubType) {
      return;
    }

    if (cacheRef.current[contentType][activeSubType!]) {
      updateContent([cacheRef.current[contentType][activeSubType!]!]);

      return;
    }

    const term = (SubTypeSearchKeyMap[activeSubType!] || activeSubType!).replace('_', ' ');
    const content: Content = { mainType: activeMainType, term };
    const subTypeObj = Elements[activeMainType][activeSubType!]!;

    if (!subTypeObj.fileNames) {
      subTypeObj.fileNames = generateFileNameArray(activeSubType!, subTypeObj.setting);
    }

    const { fileNames, pinnedNP } = subTypeObj;

    content.fileNames = fileNames;

    if (pinnedNP) {
      content.npIcons = pinnedNP;
    }

    cacheRef.current[contentType][activeSubType!] = content;
    updateContent([content]);
    getNPIcons(cacheRef.current[contentType][activeSubType!]!);
  };

  // eslint-disable-next-line hooks/exhaustive-deps
  useEffect(updateSubTypeContents, [activeSubType]);

  const updateSearchContents = (term = searchKey) => {
    if (contentType !== ContentType.Search) return;

    if (!term) {
      updateContent([]);

      return;
    }

    if (searchRef.current.timer) {
      if (searchRef.current.term === term) {
        return;
      }

      clearTimeout(searchRef.current.timer);
    }

    searchRef.current.term = term;
    searchRef.current.timer = setTimeout(() => {
      searchRef.current.timer = null;
    }, 1000);

    let content: Content = { term };
    let key = term.toLowerCase();

    key = SearchKeyMap[key] || key;

    if (cacheRef.current[contentType][key]) {
      const { fileNames } = cacheRef.current[contentType][key];

      content.fileNames = fileNames;
    } else if (SearchMap[key]) {
      const { path = [], types = [] } = SearchMap[key];

      types.forEach(([mainType, subTypes]) => {
        if (!subTypes) subTypes = Object.keys(Elements[mainType]) as SubType[];

        subTypes.forEach((subType) => {
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
    cacheRef.current[contentType][key] = content;
    updateContent([content]);
    getNPIcons(cacheRef.current[contentType][key]);
  };

  useEffect(() => {
    updateMainTabContents();
    updateSubTypeContents();
    updateSearchContents();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [contentType]);

  return (
    <ElementPanelContext.Provider
      value={{
        activeMainType,
        activeSubType,
        addToHistory,
        cacheRef,
        closeDrawer,
        contents,
        contentType,
        getNPIcons,
        hasLogin,
        historyIcons,
        open: drawerMode === 'element-panel',
        searchKey,
        setActiveMainType,
        setActiveSubType,
        setSearchKey,
        updateSearchContents,
      }}
    >
      {children}
    </ElementPanelContext.Provider>
  );
};
