<template>
  <div id="landingWrapper " class="container">
    <h1 class="bd-title">select git folder to start.</h1>
    <input type="file" name="pathInput" id="pathInput" ref="pathInput" v-if="selectedPath === null" v-on:change="changePath" webkitdirectory mozdirectory msdirectory odirectory directory multiple />
    <span id="selectedPath" v-if="selectedPath">{{selectedPath}}</span>
    <button id="selectOtherPath" class="btn btn-primary" v-if="selectedPath" v-on:click="selectedPath=null">select other</button>

    <button id="commit" class="btn btn-primary" v-if="selectedPath" v-on:click="commit">commit</button>
  </div>
</template>

<script>
export default {
  name: 'Landing',
  created() {
    this.$electron.ipcRenderer.once('git_asyncSetGitFolder', () => {
      this.$Noty({
        text: 'git repo selected!',
        theme: 'bootstrap-v4',
        type: 'success',
        force: true,
        timeout: 3000,
      }).show();

      this.$router.push('/clock');
    });

    this.$electron.ipcRenderer.once('git_asyncGitCommit', (event, args) => {
      console.log(args);
    });
  },
  mounted() {
    if (this.isGitSelected()) {
      this.$router.push('/clock');
    }
  },
  data() {
    return {
      selectedPath: null,
    };
  },
  methods: {
    changePath(e) {
      const { path } = e.target.files[0];
      const isGitInitialized = this.$electron.ipcRenderer.sendSync('git_syncCheckGitInitialized', path);

      if (isGitInitialized) {
        this.$electron.ipcRenderer.send('git_asyncSetGitFolder', path);
        this.selectedPath = path;
      }
    },
    commit() {
      // i need to add listener when mounted. this will add listener every click;
      console.log('commiting');
      this.$electron.ipcRenderer.send('git_asyncGitCommit');
    },
    isGitSelected() {
      return this.$electron.ipcRenderer.sendSync('git_syncIsGitSelected');
    },
  },
};
</script>
