// v-show-slide
//
// Initially copied from https://github.com/phegman/v-show-slide
//
// Copyright 2019 Peter Hegman <phegman@icloud.com>
//
// The following code is a derivative work of the code from Peter Hegman
// which is licensed GPLv3. https://www.gnu.org/licenses/gpl-3.0.html
//
// It may contain modifications by Albert Zhang <alchzh@gmail.com>
// and other contributors to Scatbowl/Antimony. It remains
// licensed under GPLv3.

const VShowSlide = {
  easingOptions: {
    builtIn: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
    custom: {},
  },
  targets: [],

  /**
   * Called when plugin is initialized
   */
  install(Vue, options) {
    this.validateOptions(options)
    Vue.directive('show-slide', {
      bind: this.bind.bind(this),
      inserted: this.inserted.bind(this),
      componentUpdated: this.componentUpdated.bind(this),
    })
  },

  /**
   * Bind directive hook. Called only once, when the directive is first bound to the element.
   */
  bind(el, binding) {
    console.log(binding)
    this.parseArgs(el, binding)
  },

  /**
   * Inserted directive hook. Called when the bound element has been inserted into its parent node
   */
  inserted(el, binding, vnode) {
    this.initializeTarget(el, vnode)
  },

  /**
   * Update directive hook. Called after the containing component’s VNode and the VNodes of its children have updated
   */
  componentUpdated(el, binding) {
    this.toggleSlide(el, binding)
  },

  /**
   * Get target by element
   */
  getTargetByEl(el) {
    // Use `filter` instead of `find` for IE 11 compatibility
    const target = this.targets.filter(target => target.el.isSameNode(el))[0]

    if (target === undefined) {
      throw 'Element not found!'
    }

    return target
  },

  /**
   * Set target property by element
   */
  setTargetPropertyByEl(el, property, value) {
    const target = this.getTargetByEl(el)
    const filteredTargets = this.targets.filter(
      target => !target.el.isSameNode(el)
    )

    this.targets = [
      ...filteredTargets,
      {
        ...target,
        [property]: value,
      },
    ]
  },

  /**
   * Validate options passed to plugin
   */
  validateOptions(options) {
    if (
      typeof options !== 'undefined' &&
      Object.prototype.hasOwnProperty.call(options, 'customEasing')
    ) {
      this.easingOptions.custom = options.customEasing
    }
  },

  /**
   * Convert a string from kebab-case to camelCase
   */
  kebabToCamel(string) {
    return string.replace(/-([a-z])/g, function(g) {
      return g[1].toUpperCase()
    })
  },

  /**
   * Parse directive arguments
   */
  parseArgs(el, binding) {
    if (
      Object.prototype.hasOwnProperty.call(binding, 'arg') &&
      typeof binding.arg === 'string'
    ) {
      const argsArray = binding.arg.split(':')
      const easing = this.validateEasing(argsArray)
      const duration = this.validateDuration(argsArray)
      const { startAction, initialState }  = this.validateStartAction(argsArray, binding.value)

      this.targets.push({
        el,
        duration,
        durationInSeconds: `${duration / 1000}s`,
        easing,
        isAnimating: false,
        startAction,
        initialState
      })
    } else {
      this.targets.push({
        el,
        duration: 300,
        durationInSeconds: '0.3s',
        easing: 'ease',
        isAnimating: false,
        startAction: null,
        initialState: binding.value
      })
    }
  },

  /**
   * Validate easing option
   */
  validateEasing(argsArray) {
    if (Object.prototype.hasOwnProperty.call(argsArray, 1)) {
      if (this.easingOptions.builtIn.indexOf(argsArray[1]) > -1) {
        return argsArray[1]
      } else if (
        Object.prototype.hasOwnProperty.call(
          this.easingOptions.custom,
          this.kebabToCamel(argsArray[1])
        )
      ) {
        return this.easingOptions.custom[this.kebabToCamel(argsArray[1])]
      } else {
        return 'ease'
      }
    } else {
      return 'ease'
    }
  },

  /**
   * Validate duration
   */
  validateDuration(argsArray) {
    return Object.prototype.hasOwnProperty.call(argsArray, 0)
      ? parseInt(argsArray[0])
      : 300
  },

  /**
   * Validate start action
   */
  validateStartAction(argsArray, open) {
    if (Object.prototype.hasOwnProperty.call(argsArray, 2)) {
      if (argsArray[2] === "startOpening" && open) {
        return { startAction: "open", initialState: false}
      } else if (argsArray[2] === "startClosing" && !open) {
        return { startAction: "close", initialState: true}
      }
    }
    return { startAction: null, initialState: open}
  },

  /**
   * Initialize styles on target element
   */
  initializeTarget(el, vnode) {
    const { easing, durationInSeconds, startAction, initialState } = this.getTargetByEl(el)

    if (!initialState) {
      el.style.height = '0px'
      el.style.visibility = 'hidden'
    }

    el.style.overflow = 'hidden'
    el.style.transition = `height ${easing} ${durationInSeconds}`

    if (startAction === "open") {
      vnode.context.$nextTick(() => this.slideOpen(el))
    } else if (startAction === "close") {
      vnode.context.$nextTick(() => this.slideClosed(el))
    }
  },

  /**
   * Toggle the element
   */
  toggleSlide(el, binding) {
    if (binding.value !== binding.oldValue) {
      if (binding.value) {
        this.slideOpen(el)
      } else {
        this.slideClosed(el)
      }
    }
  },

  /**
   * Slide element open
   */
  slideOpen(el) {
    const { isAnimating, timeout, duration } = this.getTargetByEl(el)

    // Check if element is animating
    if (isAnimating) {
      clearTimeout(timeout)
    }

    // Set animating to true
    this.setTargetPropertyByEl(el, 'isAnimating', true)

    // Make element visible again
    el.style.visibility = 'visible'

    // Set element height to scroll height
    let scrollHeight = el.scrollHeight
    el.style.height = `${scrollHeight}px`

    // Reset element height to auto after animating
    const newTimeout = setTimeout(() => {
      el.style.height = 'auto'
      this.setTargetPropertyByEl(el, 'isAnimating', false)
    }, duration)

    this.setTargetPropertyByEl(el, 'timeout', newTimeout)
  },

  /**
   * Slide element closed
   */
  slideClosed(el) {
    const { isAnimating, timeout, duration } = this.getTargetByEl(el)
    // Check if element is animating
    if (isAnimating) {
      clearTimeout(timeout)
    }

    // Set animating to true
    this.setTargetPropertyByEl(el, 'isAnimating', true)

    let scrollHeight = el.scrollHeight
    el.style.height = `${scrollHeight}px`
    // https://gist.github.com/paulirish/5d52fb081b3570c81e3a
    const forceRedraw = el.offsetLeft

    el.style.height = '0px'

    // Update isAnimating after animation is done
    // And set visibility to `hidden`
    const newTimeout = setTimeout(() => {
      this.setTargetPropertyByEl(el, 'isAnimating', false)
      el.style.visibility = 'hidden'
    }, duration)

    this.setTargetPropertyByEl(el, 'timeout', newTimeout)
  },
}

export default VShowSlide
