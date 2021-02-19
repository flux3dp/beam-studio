const application = require('../test');

// action array refs: https://github.com/jlipps/simple-wd-spec#perform-actions
const mouseAction = async (actions = []) => {
    const { app } = application;
    await app.client.actions([
        {
            type: "pointer",
            id: "mouse",
            parameters: { pointerType: "mouse" },
            actions,
        },
    ]);
};

module.exports = { mouseAction };
