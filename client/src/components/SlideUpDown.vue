<template>
  <transition name="slide-up-down" @enter-cancelled="$emit('enter-cancelled')">
    <div class="slide-content" ref="content" :class="classes" :style="styles" v-show="visible">
      <slot></slot>
    </div>
  </transition>
</template>

<style scoped>
.slide-up-down-leave-active.up {
  transition: all var(--duration) cubic-bezier(.02, .01, .47, 1);
}

.slide-up-down-enter-active.down {
  transition: all var(--duration) cubic-bezier(.02, .01, .47, 1);
}

.slide-up-down-enter-to.down, .slide-up-down-leave.up {
  max-height: var(--scrollHeight);
  overflow: hidden;
}

.slide-up-down-enter.down, .slide-up-down-leave-to.up {
  overflow: hidden;
  max-height: 0;
}

.slide-content {
  will-change: max-height;
  backface-visibility: hidden;
}
</style>

<script>
export default {
  props: {
    open: {
      type: Boolean
    },
    startOpening: {
      type: Boolean,
      default: false
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
    },
    context: {
      type: String
    }
  },
  data () {
    return {
      visible: (!this.open && this.startClosing) || (this.open && !this.startOpening),
      scrollHeight: 0
    }
  },
  computed: {
    duration () {
      return 400
    },
    classes () {
      return {
        up: this.up,
        down: this.down
      }
    },
    styles () {
      return {
        '--scrollHeight': (this.scrollHeight || 0) + 'px',
        '--duration': this.duration + 'ms'
      }
    }
  },
  mounted () {
    if (this.startClosing) {
      this.scrollHeight = this.$refs.content.scrollHeight

      // this.$nextTick(() => {
      this.visible = false
      // })
    }

    if (this.startOpening) {
      this.scrollHeight = 300

      this.$nextTick(() => {
        this.visible = true
      })
    }
  },
  watch: {
    open () {
      if (this.open) {
        // this.scrollHeight = this.scrollHeight
      } else {
        this.scrollHeight = this.$refs.content.scrollHeight
      }

      this.visible = this.open

      // console.log(this.$refs.container.style.getPropertyValue('--scrollHeight'))
    }
  }
}
</script>
