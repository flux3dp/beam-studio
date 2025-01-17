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

const zoomAction = async (actions = []) => {
  const { app } = application;
  await app.client.performActions([
    {
      type: "pointer",
      id: "finger1",
      parameters: { pointerType: "touch" },
      actions: [
        { type: "pointerMove", duration: 0, "x": 100, "y": 100 },
        { type: "pointerDown", button: 0 },
        { type: "pause", duration: 500 },
        { type: "pointerMove", duration: 1000, "origin": "pointer", "x": -100, "y": 0 },
        { type: "pointerUp", button: 0 }
      ]
    }, {
      type: "pointer",
      id: "finger2",
      parameters: { pointerType: "touch" },
      actions: [
        { type: "pointerMove", duration: 0, "x": 100, "y": 100 },
        { type: "pointerDown", button: 0 },
        { type: "pause", duration: 500 },
        { type: "pointerMove", duration: 1000, "origin": "pointer", "x": 100, "y": 0 },
        { type: "pointerUp", button: 0 }
      ]
    },

  ]);
};

module.exports = { mouseAction, zoomAction };
