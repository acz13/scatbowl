<template>
  <div class="room container">
    <Question
      :wordsIn="wordsIn"
      v-bind="question"
      @reachedEnd="finishReading"
      :showAnswer="wordsIn === -1"
    ></Question>
    <b-button @click="startReading">Start Reading</b-button>
    <b-button @click="stopReading">Stop Reading</b-button>
    <b-button @click="resetReading">Reset Reading</b-button>
    <p>Words in: {{ wordsIn }} | Offset: {{ offset }} | Last Update: {{ lastUpdate % wordDelay }} | Last Timeout: {{ lastTimeout }}</p>
    <section>
      <b-field grouped>
        <b-field expanded>
          <b-slider v-model="wordDelay" :min="50" :max="500" lazy></b-slider>
        </b-field>
        <b-field>
          <b-input v-model="wordDelay" type="number"></b-input>
        </b-field>
      </b-field>
    </section>
  </div>
</template>

<script>
// import io from 'socket.io-client'
import Question from "@/components/Question"

const sampleTossup = {
  id: 89565,
  text:
    'This character considers watching twenty crabs crawl to the sea and stoning the twenty-first, "loving not, hating not, just choosing so." He contemplates a mysterious Gnostic concept called "the Quiet," which "made all things," and concludes seven stanzas with the ominous "so He," after making analogies for another figure who "dwelleth i\' the cold of the moon." This character\'s musings are used to satirize Calvinism and "Natural Theology" in a poem by Robert Browning that has him contemplating Setebos. In another work, this character falls in with the louts Stephano and Trinculo, and this son of the witch Sycorax is enslaved due to his attempted rape of Miranda. For 10 points, name this monstrous slave of Prospero from The Tempest.',
  answer: " Caliban",
  number: 19,
  tournament_id: 3,
  category_id: 15,
  subcategory_id: 22,
  round: "Virginia + Dartmouth",
  created_at: "2017-08-27T22:42:37.752Z",
  updated_at: "2017-08-28T03:54:17.132Z",
  quinterest_id: 30049,
  formatted_text:
    'This character considers watching twenty crabs crawl to the sea and stoning the twenty-first, "loving not, hating not, just choosing so." He contemplates a mysterious Gnostic concept called "the Quiet," which "made all things," and concludes seven stanzas with the ominous "so He," after making analogies for another figure who "dwelleth i\' the cold of the moon." This character\'s musings are used to satirize Calvinism and "Natural Theology" in a poem by Robert Browning that has him contemplating Setebos. In another work, this character falls in with the louts Stephano and Trinculo, and this son of the witch Sycorax is enslaved due to his attempted rape of Miranda. For 10 points, name this monstrous slave of Prospero from The Tempest.',
  formatted_answer: " Caliban",
  wikipedia_url: null,
  url: "https://www.quizdb.org/api/tossups/89565",
  type: "tossup",
  tournament: {
    id: 3,
    year: 2012,
    name: "2012 ACF Regionals",
    address: null,
    quality: null,
    type: null,
    link: null,
    created_at: "2017-08-27T18:44:13.219Z",
    updated_at: "2017-08-27T18:44:13.219Z",
    difficulty: "Regular College",
    difficulty_num: 7,
    url: "https://www.quizdb.org/api/tournaments/3"
  },
  category: {
    id: 15,
    name: "Literature",
    created_at: "2017-08-27T19:30:45.876Z",
    updated_at: "2017-08-27T19:30:45.876Z",
    url: "https://www.quizdb.org/api/categories/15"
  },
  subcategory: {
    id: 22,
    name: "Literature British",
    created_at: "2017-08-27T19:36:35.094Z",
    updated_at: "2017-08-27T19:36:35.094Z",
    url: "https://www.quizdb.org/api/subcategories/22"
  }
}

export default {
  props: {
    public: {
      type: Boolean,
      required: true
    }
  },
  data: function() {
    return {
      socket: null,
      players: {},
      settings: {},
      currentTimeout: null,
      resumePoint: 0,
      wordsIn: 0,
      startTime: null,
      wordDelay: 150,
      question: sampleTossup,
      isStopped: true,
      lastUpdate: null,
      lastTimeout: null
    }
  },
  computed: {
    offset() {
      return this.startTime % this.wordDelay
    }
  },
  methods: {
    clearTimeout() {
      clearTimeout(this.currentTimeout)
      this.currentTimeout = null
    },
    resetReading() {
      this.stopReading()

      this.wordsIn = 0
      this.resumePoint = 0
    },
    startReading() {
      this.isStopped = false

      const now = Date.now()
      this.startTime = now

      this.stepReading()
    },
    stepReading() {
      const now = Date.now()
      this.lastUpdate = now
      this.wordsIn =
        Math.floor((now + 3 - this.startTime) / this.wordDelay) +
        this.resumePoint
      if (!this.isStopped) {
        const toNext =
          this.wordDelay + 3 - ((now + 3 - this.offset) % this.wordDelay)
        this.lastTimeout = toNext

        this.currentTimeout = setTimeout(this.stepReading, toNext)
      }
    },
    stopReading() {
      this.resumePoint = this.wordsIn
      this.isStopped = true
      this.clearTimeout()
    },
    finishReading() {
      this.stopReading()
      this.wordsIn = -1
    }
  },
  watch: {
    wordDelay(val) {
      const shouldStart = !this.isStopped
      this.stopReading()

      if (shouldStart) {
        this.startReading()
      }
    }
  },
  // created () {
  //   if (this.socket) { // Shouldn't ever call but just in case
  //     return
  //   }

  //   if (this.public) {
  //     this.socket = io(process.env.SCATBOWL_SERVER, { query: { room: this.$route.params.room } })
  //   }
  // },
  // beforeRouteUpdate (to, from, next) {
  //   // called when the route that renders this component has changed,
  //   // but this component is reused in the new route.
  //   // For example, for a route with dynamic params `/foo/:id`, when we
  //   // navigate between `/foo/1` and `/foo/2`, the same `Foo` component instance
  //   // will be reused, and this hook will be called when that happens.
  //   // has access to `this` component instance.
  //   if (!to.public) {
  //     this.socket.disconnect()

  //     this.socket = null
  //   }

  //   this.socket.emit('join', to.params.room)

  //   next()
  // },
  // beforeRouteLeave (to, from, next) {
  //   // called when the route that renders this component is about to
  //   // be navigated away from.
  //   // has access to `this` component instance.
  //   this.socket.emit('leave')

  //   next()
  // },
  components: {
    Question
  }
}
</script>
