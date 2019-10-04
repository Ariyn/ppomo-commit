import { ipcMain } from 'electron';

const handlers = {
  call: (name, args) => {
    if (Object.keys(handlers).includes(name)) {
      console.log(`invoking ${name}`);
      handlers[name](args);
    } else {
      console.log(`cant find ${name} handler`);
    }
  },
};

function setEventHandlers(mainWindow, eventContext) {
  const [contextName] = Object.keys(eventContext);
  const { eventHandlers } = eventContext[contextName];

  Object.keys(eventHandlers).forEach((key) => {
    const context = {
      mainWindow,
      key: `${contextName}_${key}`, // make function change this into camelcase.
      $handlers: handlers,
    };

    console.log(`${context.key} has added`);
    handlers[context.key] = eventHandlers[key].bind(context);
    ipcMain.on(context.key, handlers[context.key]);
  });
}

export default {
  setEventHandlers,
};

