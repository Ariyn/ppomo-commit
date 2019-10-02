const state = {
  period: 0,
  intervalId: null,
  startTime: 0,
  prevTimeData: 0,
  timeData: 0,
};

const eventHandlers = {
  syncStart(event, { period }) {
    state.period = period;

    if (state.intervalId === null) {
      state.startTime = state.prevTimeData = state.timeData = new Date();

      state.intervalId = setInterval(() => {
        event.sender.send(this.key, {
          period,
          status: 'success',
          newTime: new Date(),
          startTime: state.startTime,
        });
      }, state.period);
    }
  },
  asyncStop() {
    clearInterval(state.intervalId);
    state.intervalId = undefined;
  },
  asyncSetProgress(event, value) {
    this.mainWindow.setProgressBar(value);
  },
  syncLoadData(event) {
    event.returnValue = {
      startTime: state.startTime,
      prevTimeData: state.prevTimeData,
      timeData: state.timeData,
    };
  },
};

export default {
  eventHandlers,
};
