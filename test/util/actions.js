const application = require('../test');

// action array refs: https://github.com/jlipps/simple-wd-spec#perform-actions
const mouseAction = async (actions = []) => {
    const { app } = application;
    await app.client.performActions([
        {
            type: "pointer",
            id: "mouse",
            parameters: { pointerType: "mouse" },
            actions,
        },
    ]);
};

const keyAction = async(actions = []) =>{
    const { app } = application;
    await app.client.performActions([
        {
            type:"key",
            id: "keyboard",
            actions,
        },
    ]);
};



const touchAction = async(actions = []) =>{
    const { app } = application;
    await app.client.performActions([
        {
            type: "pointer",
            id: "mouse",
            parameters: { pointerType: "mouse" },
            actions: [
                {},
                {},
                {},
            ],
        },
        {
            type:"key",
            id: "keyboard",
            actions: [
                {},
                {},
                {},
            ],
        },
        {
            type: "pointer",
            id: "mouse",
            parameters: { pointerType: "mouse" },
            actions: [
                {},
                {},
                {},
            ],
        },
    ]);
};

  
module.exports = { mouseAction , keyAction , touchAction, };
