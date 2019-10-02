<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'ppomo-git',
  data() {
    return {
      debuggingPath: '/',
    };
  },
  created() {
    if (this.debuggingPath !== undefined
      && this.$router.history.current.path !== this.debuggingPath) {
      this.$router.push(this.debuggingPath);
    }
  },
};
</script>

<style>
  /* CSS */
</style>
