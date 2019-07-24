<template>
  <div class="main">
    <div class="info">
      <div>Blocks: {{$store.state.lines}}</div>
      <div class="stakan next">
        <div v-for="y in getSize"
             :key="y"
             class="row">
          <div v-for="x in getSize"
               :key="x"
               :class="getNextClass(x, y)">
          </div>
        </div>
      </div>
      <div>Level: {{$store.state.level+1}}</div>
      <div>Score: {{$store.state.score}}</div>
      <div v-show="$store.state.bonus">Bonus: {{$store.state.bonus}}</div>
    </div>
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
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters(['getWellValue', 'getDimensions', 'getNextValue', 'getSize'])
  },
  methods: {
    getThemeClass(x, y) {
      return 'N' + this.getWellValue(x, y)
    },
    getThemeSymbol(x, y) {
      return this.getWellValue(x, y) ? '&nbsp' : '.'
    },
    getNextClass(x, y) {
      return 'N' + this.getNextValue(x, y)
    }
  }
}
</script>

<style lang="stylus" scoped>
.main {
  text-align: center
  display: flex
  // margin: auto
  // flex-direction: row
  justify-content: center

  .info {
    display: flex
    padding: 1rem
    flex-direction: column
    min-width: 7rem
    align-items: center

    &> div {
      padding-bottom: 0.3rem
    }
  }

  .stakan {
    display: flex
    flex-direction: column-reverse

    // flex: 1 1
    // display: flex
    // margin: auto
    // flex-direction: column-reverse
    // justify-content: center
    // text-align: center
    .row {
      display: flex

      // flex-direction: row
      // justify-content: center
      // align-items: baseline
      & > div {
        height: 25px
        width: 25px
        // flex: 0 0 25px
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
            content: '—'
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

  .next {
    border: none

    .row {
      .N0 {
        background: transparent
      }
    }
  }
}
</style>
