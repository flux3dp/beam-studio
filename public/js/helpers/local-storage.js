define(['localStorage'], function(localStorage) {
    'use strict';
    const Store = require('electron-store');
    var store = new Store();

    return {
        /**
         * getter
         *
         * @param {string} setting's name
         *
         * @return mixed
         */
        get : function(name) {
            name = name || '';
            var item = store.get(name),
                temp_item;

            item = (item !== undefined ? item : '');

            try {
                temp_item = JSON.parse(item);

                if ('object' === typeof temp_item) {
                    item = temp_item;
                }
            }
            catch (ex) {
                // TODO: do something
            }

            return item;
        },

        /**
         * setter
         *
         * @param {string} setting's name
         * @param {mixed}  setting's content
         *
         * @return this
         */
        set : function(name, val) {
            name = name || '';
            //val = ('object' === typeof val ? JSON.stringify(val) : val);

            store.set(name, val);

            return this;
        },

        /**
         * remove by name
         *
         * @param {string} setting's name
         *
         * @return this
         */
        removeAt : function(name) {
            store.delete(name);

            return this;
        },

        /**
         * clear all
         *
         * @return this
         */
        clearAll : function() {
            store.clear();

            return this;
        },

        /**
         * clear all except poke-ip-address
         *
         * @return this
         */
        clearAllExceptIP : function() {
            let ip = this.get('poke-ip-addr');
            this.clearAll();
            this.set('poke-ip-addr', ip);

            return this;
        },

        /**
         * key is existing
         *
         * @param {string} key - key name
         *
         * @return bool
         */
        isExisting : function(key) {
            return store.has(key);
        }

    };
});