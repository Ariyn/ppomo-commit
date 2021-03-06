<template>
  <div class="container d-flex justify-content-center">
    <button class="btn btn-primary" v-on:click="resetFolder">select other repo</button>
    <br />
    <svg id="timerSvg">
      <g id="timerG" v-on:click="startTimer"></g>
      <g id="dialG"></g>
    </svg>
  </div>
</template>

<script>
import * as d3 from 'd3';

export default {
  name: 'PolarClock',
  data() {
    return {
      size: [300, 300],
      innerRadius: 15,
      outerRadius: 100,
      cornerRadius: 3,
      transitionDuration: 500,

      dials: [0, 5, 10, 15, 20, 25],
      dialSpacing: 30,
      dialFontSize: 1,

      startTime: new Date().getTime(),
      prevTimeData: new Date(),
      timeData: new Date(),
      circularClockSecond: 60 * 30,

      isTimerTicking: false,
      intervalTime: 1000,
    };
  },
  computed: {
    arc() {
      return d3.arc()
        .startAngle(0)
        .endAngle(d => d.value * 2 * Math.PI)
        .innerRadius(this.innerRadius)
        .outerRadius(this.outerRadius)
        .cornerRadius(this.cornerRadius);
    },
    width() {
      return this.size !== undefined ? this.size[0] : 300;
    },
    height() {
      return this.size !== undefined ? this.size[1] : 300;
    },
    timerTotalSecond() {
      return (this.timeData.getTime() - this.startTime) / 1000;
    },
    timerSecond() {
      return Math.floor(this.timerTotalSecond % this.circularClockSecond);
    },
    timerMinute() {
      return Math.floor(this.timerTotalSecond / this.circularClockSecond);
    },
    timer() {
      return [{
        previousValue: 1 - this.calcInterTime(this.prevTimeData.getTime(), this.startTime),
        value: 1 - this.calcInterTime(this.timeData.getTime(), this.startTime),
      }];
    },
  },
  watch: {
    timeData() {
      this.sendProgress();
      this.render();
    },
    $route() {
      this.initSvg();
      this.render();
    },
  },
  mounted() {
    this.initSvg();
    this.initTimerSvg();
    this.initDialSvg();

    this.$electron.ipcRenderer.on('timer_syncStart', (event, { newTime, startTime }) => {
      this.prevTimeData = this.timeData;
      this.timeData = new Date(newTime);
      this.startTime = new Date(startTime);

      this.isTimerTicking = true;
    });

    this.$electron.ipcRenderer.on('timer_syncStop', () => {
      this.checkDone();
    });

    this.$electron.ipcRenderer.on('timer_syncStart', (event, { newTime, startTime }) => {
      this.prevTimeData = this.timeData;
      this.timeData = new Date(newTime);
      this.startTime = new Date(startTime);

      this.isTimerTicking = true;
    });

    this.$electron.ipcRenderer.on('git_asyncGitCommit', (event, result) => {
      this.isTimerTicking = false;

      const text = result.error ? 'failed to commit!' : 'commit successfully';
      const type = result.error ? 'error' : 'success';

      this.$Noty({
        text,
        type,
        theme: 'bootstrap-v4',
        timeout: 3000,
      }).show();
    });
  },
  methods: {
    initSvg() {
      d3.select('svg')
        .attr('width', this.width)
        .attr('height', this.height);
    },
    initTimerSvg() {
      d3.select('#timerG')
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('transform', `translate(${this.width / 2}, ${this.height / 2})`);

      d3.select('#timerG')
        .selectAll('path')
        .data(this.timer)
        .enter()
        .append('path')
        .attr('d', this.arc)
        .style('fill', '#E83345');
    },
    startTimer() {
      // TODO: need 'auto releasing handler'.
      // TODO: there will be 2 intervals when reload page.
      if (this.isTimerTicking === false) {
        this.$electron.ipcRenderer.send('timer_syncStart', {
          interval: this.intervalTime,
          circularClockSecond: this.circularClockSecond,
        });

        this.$Noty({
          text: 'ppomodoro started!',
          type: 'success',
          theme: 'bootstrap-v4',
          timeout: 3000,
        }).show();

        this.isTimerTicking = true;
      }
    },
    initDialSvg() {
      d3.select('#dialG')
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('transform', `translate(${this.width / 2}, ${this.height / 2})`);

      d3.select('#dialG')
        .selectAll('text')
        .data(this.dials)
        .enter()
        .append('text')
        .style('fill', '#DDD')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'alphabetic')
        .attr('font-size', `${this.dialFontSize}em`)
        .attr('x', (d, index) => {
          const angle = ((360 / this.dials.length) * index) - 90;
          const radian = Math.cos(angle * (Math.PI / 180));

          return (this.outerRadius + this.dialSpacing) * radian;
        })
        .attr('y', (d, index) => {
          const angle = ((360 / this.dials.length) * index) - 90;
          const radian = Math.sin(angle * (Math.PI / 180));

          return (this.outerRadius + this.dialSpacing) * radian;
        })
        .text(d => d);
    },
    checkDone() {
    },
    calcInterTime(a, b) {
      const delta = (a - b) / 1000;
      return (delta % this.circularClockSecond) / this.circularClockSecond;
    },
    render({ timer } = { timer: undefined }) {
      const timerData = timer !== undefined ? timer : this.timer;

      d3.select('#timerG')
        .selectAll('path')
        .data(timerData)
        .transition()
        .ease(d3.easeElastic)
        .duration(this.transitionDuration)
        .attrTween('d', this.arcTween);
    },
    sendProgress() {
      const progress = (this.timerSecond === 0) ? 1 : (1 - this.timer[0].value);
      this.$electron.ipcRenderer.send('timer_asyncSetProgress', progress);
    },
    arcTween(d) {
      const interpolateNumber = d3.interpolateNumber(d.previousValue, d.value);

      return (t) => {
        d.value = interpolateNumber(t);
        return this.arc(d);
      };
    },
    resetFolder() {
      this.$electron.ipcRenderer.sendSync('git_syncRestSelectedGitFolder');
      this.$router.push('/');
    },
  },
};
</script>

<style>
.arc-text {
  font: 16px sans-serif;
}

.arc-center {
  fill: none;
}

#credit {
  position: absolute;
  font: 10px sans-serif;
  right: 10px;
  bottom: 10px;
  color: #ddd;
}

p, text {
  color: #ddd;
}

#timerG {
  cursor: pointer;
}

#credit a {
  color: inherit;
}
</style>