define([
    'helpers/api/config',
], function(Config) {
    const config = Config();
    const init = () => {
        const alertConfig = config.read('alert-config');
        if (!alertConfig) {
            config.write('alert-config', {});
        }
    };
    init();

    return {
        read: (key) => {
            return config.read('alert-config')[key];
        },
        write: (key, value) => {
            const alertConfig = config.read('alert-config') || {};
            alertConfig[key] = value;
            config.write('alert-config', alertConfig);
        }
    };
});
