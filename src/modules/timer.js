const state = {
  interval: 0,
  intervalId: null,
  startTime: 0,
  prevTimeData: 0,
  timeData: 0,
};

const eventHandlers = {
  syncStart(event, { interval, circularClockSecond }) {
    state.interval = interval;
    state.circularClockSecond = circularClockSecond;

    if (state.intervalId === null) {
      state.startTime = state.prevTimeData = state.timeData = new Date();

      state.intervalId = setInterval(() => {
        const now = new Date();

        event.sender.send(this.key, {
          interval,
          status: 'success',
          newTime: now,
          startTime: state.startTime,
        });

        const totalTime = (now.getTime() - state.startTime.getTime()) / 1000;
        if (state.circularClockSecond - totalTime < 0) {
          eventHandlers.asyncStop();
          this.$handlers.call('git_asyncGitCommit', event);

          event.sender.send('timer_syncStop');
        }
      }, state.interval);
    }
  },
  asyncStop() {
    clearInterval(state.intervalId);
    state.intervalId = null;
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
