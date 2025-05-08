import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import type {
  DimensionKey,
  DimensionKeyBoolean,
  DimensionKeyNumber,
  DimensionValues,
} from '@core/interfaces/ObjectPanel';

const objectPanelEventEmitter = eventEmitterFactory.createEventEmitter('object-panel');

const updateDimensionValues = (newValue: DimensionValues): void => {
  objectPanelEventEmitter.emit('UPDATE_DIMENSION_VALUES', newValue);
};

/* eslint-disable no-redeclare */
function getDimensionValues(): DimensionValues;
function getDimensionValues(key: DimensionKeyNumber): number;
function getDimensionValues(key: DimensionKeyBoolean): boolean;
function getDimensionValues(key?: DimensionKey): any {
  const response = {
    dimensionValues: {},
  };

  objectPanelEventEmitter.emit('GET_DIMENSION_VALUES', response, key);

  return response.dimensionValues;
}
/* eslint-enable no-redeclare */

const minEventInterval = 50;
let updateObjectPanelTimeout: NodeJS.Timeout | undefined = undefined;

export const updateObjectPanel = (): void => {
  clearTimeout(updateObjectPanelTimeout);

  updateObjectPanelTimeout = setTimeout(() => {
    objectPanelEventEmitter.emit('UPDATE_OBJECT_PANEL');
  }, minEventInterval);
};

const updatePolygonSides = (polygonSides: number): void => {
  objectPanelEventEmitter.emit('UPDATE_POLYGON_SIDES', polygonSides);
};

const updateActiveKey = (activeKey: null | string): void => {
  objectPanelEventEmitter.emit('UPDATE_ACTIVE_KEY', activeKey);
};

const getActiveKey = (): null | string => {
  const response = {
    activeKey: undefined as any,
  };

  objectPanelEventEmitter.emit('GET_ACTIVE_KEY', response);

  return response.activeKey as null | string;
};

export default {
  events: objectPanelEventEmitter,
  getActiveKey,
  getDimensionValues,
  updateActiveKey,
  updateDimensionValues,
  updateObjectPanel,
  updatePolygonSides,
};
