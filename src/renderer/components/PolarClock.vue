<template>
  <svg id="timerSvg">
    <g id="timerG"></g>
    <g id="dialG"></g>
  </svg>
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
      transitionDuration: 300,

      dials: [0, 5, 10, 15, 20, 25],
      dialSpacing: 30,
      dialFontSize: 1,

      startTime: new Date().getTime(),
      prevTimeData: new Date(),
      timeData: new Date(),
      circularClockSecond: 60 * 30,

      intervalTimer: 1000,
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
      this.checkDone();
      this.sendProgress();
      this.render();
    },
    $route() {
      this.initSvg();
      this.render();
    },
  },
  mounted() {
    // DEBUGING CODE
    this.startTime = this.startTime - (this.circularClockSecond * 1000 * 0.5);
    // DEBUGING CODE

    this.initSvg();
    this.initTimerSvg();
    this.initDialSvg();

    this.startTimer();
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
      this.$electron.ipcRenderer.send('timer_syncStart', { period: this.intervalTimer });
      this.$Noty({
        text: 'ppomodoro started!',
        type: 'success',
        theme: 'bootstrap-v4',
        timeout: 3000,
      }).show();

      this.$electron.ipcRenderer.on('timer_syncStart', (event, { newTime, startTime }) => {
        this.prevTimeData = this.timeData;
        this.timeData = new Date(newTime);
        this.startTime = new Date(startTime);
      });
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
      if (this.timerSecond === 0) {
        this.$electron.ipcRenderer.send('timer_asyncStop');
      }
    },
    calcInterTime(a, b) {
      const delta = (a - b) / 1000;
      return (delta % this.circularClockSecond) / this.circularClockSecond;
    },
    render() {
      d3.select('#timerG')
        .selectAll('path')
        .data(this.timer)
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
  },
};
</script>

<style>
body {
  background: #222;
  margin: auto;
  width: 300px;
}

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


#credit a {
  color: inherit;
}
</style>