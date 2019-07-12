<template>
  <div id="app">
    <stakan msg="stakan" />
  </div>
</template>

<script>
import stakan from './components/stakan.vue'

export default {
  name: 'app',
  components: {
    stakan
  }
}
</script>
<style lang="stylus">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
