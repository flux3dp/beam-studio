/**
 * logger
 */
const loggingStore: any = {};

// NOTICE: use "NEW" operator to create object
export default (name: string, maxLog?: number) => ({
  append(message) {
    if (!loggingStore[name]) {
      loggingStore[name] = [];
    }

    loggingStore[name].push(message);

    if (maxLog && loggingStore[name].length > maxLog) {
      loggingStore[name].shift();
    }

    return loggingStore[name];
  },

  clear() {
    delete loggingStore[name];
  },

  getAll() {
    return loggingStore;
  },
});
