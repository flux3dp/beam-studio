/**
 * Data history handler
 */
var History = function(defaultData?: any) {
    var history = [];

    return {
        push: function(name, data) {
            history.push({
                name: name,
                data: data
            });
        },
        pop: function() {
            return history.pop();
        },
        update: function(name, data) {
            var filtered = history.filter(function(arr) {
                return name === arr.name;
            });

            filtered.forEach(function(el) {
                el.data = data;
            });

            return filtered.length;
        },
        findByName: function(name) {
            return history.filter(function(arr) {
                return name === arr.name;
            });
        },
        get: function() {
            return history;
        },
        clearAll: function() {
            history = [];
        },
        deleteAt: function(name) {
            var index = history.findIndex(function(obj) {
                return obj.name === name;
            });

            if (-1 !== index) {
                history.splice(index, 1);
                return true;
            }
            else {
                return false;
            }
        },
        getLatest: function() {
            return (0 < history.length ? history.slice(-1)[0] : defaultData);
        },
        isEmpty: function() {
            return 0 === history.length;
        }
    };
};

export default function() {
    return History();
};
