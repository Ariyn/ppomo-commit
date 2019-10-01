<template>
  <div id="gitInfoWrapper" class="container">
    <div id="gitStatus">
      <div id="gitStatusTitle">Git Status</div>
      <div id="gitStatusPre">{{status}}</div>
    </div>

    <div id="gitLogs">
      <div id="gitLogsTitle">Git Logs</div>
      <div id="gitLogsPre">
        <ul>
          <li v-for="log in logs" v-bind:key="log.date">
            {{log.message}}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { gitLog, gitStatus } from '@/GitWrapper';

export default {
  name: 'GitInfo',
  computed: {
    logs() {
      return this.$store.state.Git.logs;
    },
    status() {
      return this.$store.state.Git.status;
    },
  },
  mounted() {
    this.loadLogs();
    this.loadStatus();
  },
  methods: {
    loadLogs() {
      const selectedPath = 'C:\\Users\\ariyn\\Documents\\electron\\ppomo-git\\test-git\\';
      const logFunc = async () => {
        const logs = await gitLog(selectedPath, { branch: 'ppomo-commit' });
        return logs;
      };

      const store = this.$store;
      logFunc()
        .then((logs) => {
          store.dispatch('asyncUpdateLogs', { logs });
        });
    },
    loadStatus() {
      const selectedPath = 'C:\\Users\\ariyn\\Documents\\electron\\ppomo-git\\test-git\\';
      const statusFunc = async () => {
        const logs = await gitStatus(selectedPath, { branch: 'ppomo-commit' });
        return logs;
      };

      const store = this.$store;
      statusFunc()
        .then((status) => {
          store.dispatch('asyncUpdateStatus', { status });
        });
    },
  },
};
</script>
