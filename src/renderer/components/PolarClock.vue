<template>
  <svg id="timerSvg">
    <g id="timerG"></g>
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
      startTime: new Date().getTime(),
      prevTimeData: new Date(),
      timeData: new Date(),
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
  },
  watch: {
    timeData() {
      this.render();
    },
    $route() {
      this.initSvg();
      this.render();
    },
  },
  mounted() {
    this.initSvg();

    setInterval(() => {
      this.prevTimeData = this.timeData;
      this.timeData = new Date();
    }, 1000);
  },
  methods: {
    initSvg() {
      d3.select('svg')
        .attr('width', this.width)
        .attr('height', this.height);

      d3.select('g')
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('transform', `translate(${this.width / 2}, ${this.height / 2})`);

      d3.select('#timerG')
        .selectAll('path')
        .data(this.getTime)
        .enter()
        .append('path')
        .attr('d', this.arc)
        .style('fill', '#E83345');
    },
    getTime() {
      return [{
        previousValue: this.calcInterTime(this.prevTimeData.getTime(), this.startTime),
        value: this.calcInterTime(this.timeData.getTime(), this.startTime),
      }];
    },
    calcInterTime(a, b) {
      return (((a - b) / 1000) % 60) / 60;
    },
    render() {
      d3.select('#timerG')
        .selectAll('path')
        .data(this.getTime)
        .transition()
        .ease(d3.easeElastic)
        .duration(300)
        .attrTween('d', this.arcTween);
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

p {
  color: #ddd;
}

#credit a {
  color: inherit;
}
</style>