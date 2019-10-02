import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Landing',
      component: require('@/components/Landing').default,
    },
    {
      path: '*',
      redirect: '/',
    },
    {
      path: '/clock',
      name: 'PolarClock',
      component: require('@/components/PolarClock').default,
    },
  ],
});
