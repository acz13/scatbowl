<template>
  <transition name="slide-up-down" @enter-cancelled="$emit('enter-cancelled')">
    <div class="slide-content" ref="content" :class="classes" :style="styles" v-show="visible">
      <slot></slot>
    </div>
  </transition>
</template>

<style scoped>
.slide-up-down-enter-active.down, .slide-up-down-leave-active.up {
  transition-duration: var(--duration);
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

.slide-content {
  will-change: max-height;
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
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
    },
    wait: {
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
      return this.scrollHeight / 1000
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
        this.scrollHeight = this.$refs.content.scrollHeight
      }

      if (this.wait) {
        window.requestAnimationFrame(() => {
          this.visible = this.open
        })
      } else {
        this.visible = this.open
      }
      // console.log(this.$refs.container.style.getPropertyValue('--scrollHeight'))
    }
  }
}
</script>
