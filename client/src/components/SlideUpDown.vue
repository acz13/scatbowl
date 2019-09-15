<template>
  <transition name="slide-up-down">
    <div ref="whatever" :class="classes" :style="styles" v-show="visible">
      <slot></slot>
    </div>
  </transition>
</template>

<style scoped>
.slide-up-down-enter-active.down, .slide-up-down-leave-active.up {
  transition-duration: var(--duration);
  box-shadow: 0 2px 3px rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.1);
  transition-timing-function: linear;
}

.slide-up-down-enter-to.down, .slide-up-down-leave.up {
  max-height: var(--scrollHeight);
  overflow: hidden;
}

.slide-up-down-enter.down, .slide-up-down-leave-to.up {
  overflow: hidden;
  max-height: 0;
}
</style>

<script>
export default {
  props: {
    open: {
      type: Boolean
    },
    startClosing: {
      type: Boolean,
      default: false
    },
    up: {
      type: Boolean,
      default: false
    },
    down: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      visible: true,
      scrollHeight: '0px'
    }
  },
  computed: {
    duration () {
      return this.scrollHeight / 200
    },
    classes () {
      return {
        up: this.up,
        down: this.down
      }
    },
    styles () {
      return {
        '--scrollHeight': (this.scrollHeight ? this.scrollHeight : 0) + 'px',
        '--duration': this.duration + 's'
      }
    }
  },
  watch: {
    open () {
      if (this.open) {
        this.scrollHeight = this.scrollHeight + 100
      } else {
        this.scrollHeight = this.$refs.whatever.scrollHeight
      }
      this.visible = this.open
      // console.log(this.$refs.container.style.getPropertyValue('--scrollHeight'))
    }
  }
}
</script>
