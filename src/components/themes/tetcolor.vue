<template>
  <div class="main">
    <div class="info">
      <div>Blocks: {{$store.state.lines}}</div>
      <div class="stakan next">
        <div v-for="y in 3"
             :key="y"
             class="row">
          <div v-for="x in 3"
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
             :class="getThemeClass(x, y)"
             v-if="!isBorder(x,y)">
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters(['getWellValue', 'getDimensions', 'getNextValue'])
  },
  methods: {
    getThemeClass(x, y) {
      const val = this.getWellValue(x, y)
      const valL = this.getWellValue(x - 1, y)
      const valU = this.getWellValue(x, y + 1)
      const valR = this.getWellValue(x + 1, y)
      const valD = this.getWellValue(x, y - 1)

      return {
        ['N' + val]: val != -1,
        item: val != 0,
        left: (val != 0 && valL != 0) || valL == 0,
        bottom: (val != 0 && valD != 0) || valD == 0,
        empty: val == 0,
        right: val == 0 && valR != 0,
        top: val == 0 && valU != 0
      }
    },
    getNextClass(x, y) {
      const val = this.getNextValue(x, y)
      const valL = this.getNextValue(x - 1, y)
      const valD = this.getNextValue(x, y - 1)
      return {
        ['N' + val]: val >= 0,
        item: val != 0,
        left: val != 0 && valL != 0,
        bottom: val != 0 && valD != 0
      }
    },
    isBorder(x, y) {
      const w = this.getDimensions.width
      return y == 1 || x == 1 || x == w
    }
  },
  created() {}
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
    border: 5px groove #c0eac1
    border: 4px double #42c339

    .row {
      display: flex

      & > div {
        height: 25px
        width: 25px
        background-color: #AAAAAA
        font-family: 'Helvetica Neue'
        font-weight: 900
        font-size: 20px
        box-sizing: border-box

        &.item {
          border: 1px solid $border-color

          &.left {
            border-left: none
          }

          &.bottom {
            border-bottom: none
          }
        }

        &.empty {
          border: none

          &.right {
            border-right: 1px solid $border-color
          }

          &.top {
            border-top: 1px solid $border-color
          }
        }

        &.N1 {
          background-color: #89FB6E
        }

        &.N2 {
          background-color: #EC64F8
        }

        &.N3 {
          background-color: #EC615C
        }

        &.N4 {
          background-color: #FFFE73
        }

        &.N5 {
          background-color: #5458F6
        }

        &.N6 {
          background-color: #89FCFD
        }

        &.N-2 {
          background-color: #000BA4
        }

        &.N-1 {
          background-color: #abc
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
