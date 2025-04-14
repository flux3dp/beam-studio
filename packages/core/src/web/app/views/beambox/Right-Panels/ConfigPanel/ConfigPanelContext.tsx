import { createContext } from 'react';

// TODO: create a selectedLayers Store and replace this
interface Context {
  selectedLayers: string[];
}

export default createContext<Context>({} as Context);
