<template>
  <div class="stakan">
    <div v-for="y in getDimensions.height"
         :key="y"
         class="row">
      <div v-for="x in getDimensions.width"
           :key="x"
           :class="getThemeClass(x, y)">
        <span v-html="getThemeSymbol(x, y)"></span>
      </div>
    </div>
    <div> {{$store.state.item}} </div>
    <!-- <div> Total lines: {{$store.state.lines}} </div> -->
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters(['getWellValue', 'getDimensions'])
  },
  methods: {
    getThemeClass(x, y) {
      return 'N' + this.getWellValue(x, y)
    },
    getThemeSymbol(x, y) {
      return this.getWellValue(x, y) ? '&nbsp' : '.'
    }
  }
}
</script>

<style lang="stylus" scoped>
.stakan {
  flex: 1 1
  display: flex
  margin: auto
  flex-direction: column-reverse
  justify-content: center
  text-align: center

  .row {
    display: flex
    flex-direction: row
    justify-content: center
    align-items: baseline

    & > div {
      // height: 25px;
      // width: 25px;
      flex: 0 0 25px
      background-color: #efe
      // background-color: #eee
      font-family: 'Helvetica Neue'
      font-weight: 900
      font-size: 20px

      &.N1 {
        background-color: #8cff8c
      }

      &.N2 {
        background-color: #ed8cff
      }

      &.N3 {
        background-color: lightness(#ed8cff, 81%)
      }

      &.N4 {
        background-color: #ff6c6c
      }

      &.N5 {
        background-color: #caca0a
      }

      &.N6 {
        background-color: #4fb6ff
      }

      &.N7 {
        background-color: #4ff6ff
      }

      &.N-2 {
        background-color: #aebece

        &:before {
          content: '--'
        }
      }

      &.N-1 {
        // background-color: #abc
        background-color: #eee

        &:before {
          content: '/\\'
        }
      }
    }
  }
}
</style>
