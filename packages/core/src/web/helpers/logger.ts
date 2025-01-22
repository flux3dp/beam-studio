/**
 * logger
 */
const loggingStore: any = {};

// NOTICE: use "NEW" operator to create object
export default (name: string) => ({
  append(message) {
    if (!loggingStore[name]) {
      loggingStore[name] = [];
    }

    loggingStore[name].push(message);

    return loggingStore[name];
  },

  clear() {
    delete loggingStore[name];
  },

  getAll() {
    return loggingStore;
  },
});
