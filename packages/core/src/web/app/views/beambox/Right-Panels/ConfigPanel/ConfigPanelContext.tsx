import { createContext } from 'react';

interface Context {
  selectedLayers: string[];
  simpleMode?: boolean;
}

export default createContext<Context>({} as Context);
