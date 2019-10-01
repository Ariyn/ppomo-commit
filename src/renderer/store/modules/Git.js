import Vue from 'vue';

const state = {
  status: '',
  logs: [],
};

const mutations = {
  UPDATE_LOGS(state, logs) {
    Vue.set(state, 'logs', logs);
  },
  UPDATE_STATUS(state, status) {
    state.status = status;
  },
};

const actions = {
  asyncUpdateLogs({ commit }, { logs }) {
    commit('UPDATE_LOGS', logs);
  },
  asyncUpdateStatus({ commit }, { status }) {
    commit('UPDATE_STATUS', status);
  },
};

export default {
  state,
  mutations,
  actions,
};
