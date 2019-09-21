<template>
  <div class="card">
    <div class="card-header">
      <p class="card-header-title">Settings</p>
    </div>
    <div class="card-content">
      <!-- <b-field grouped label="Delay">
        <b-field expanded>
          <b-slider v-model="wordDelay" :min="25" :max="500" lazy></b-slider>
        </b-field>
        <b-field>
          <b-input v-model.lazy="wordDelay" type="number" :min="25" :max="500"></b-input>
        </b-field>
      </b-field> -->
      <!-- <b-field grouped label="WPM">
        <b-field expanded>
          <b-slider
            :value="Math.round(60000 / wordDelay)"
            @input="wpmInput($event)"
            :min="120"
            :max="2400"
            lazy
          >
            <template v-for="val in 95">
              <b-slider-tick :value="60000 / (24 + 5 * val)" :key="val">{{ 24 + 5 * val }}</b-slider-tick>
            </template>
          </b-slider>
        </b-field>
        <b-field>
          <b-input
            :value="Math.round(60000 / wordDelay)"
            @change="wpmInput($event)"
            type="number"
            :min="120"
            :max="2400"
          ></b-input>
        </b-field>
      </b-field> -->
      <b-field label="Difficulty">
        <b-taginput
          :value="difficulty"
          :data="filteredDifficulty"
          autocomplete
          openOnFocus
          field="title"
          @typing="getFilteredDifficulty"
          @input="tempDifficulty = $event.map(d => d.name); getFilteredDifficulty('')"
          @blur="$emit('changeSettings', { difficulty: tempDifficulty })"
        >
          <template slot-scope="props">
            <strong>{{ props.option.number }}</strong> ({{ props.option.title }})
          </template>
          <template slot="empty">
            No difficulties found
          </template>
        </b-taginput>
      </b-field>
      <b-field label="Category">
        <b-taginput
          :value="category"
          :data="filteredCategory"
          autocomplete
          openOnFocus
          field="name"
          @typing="getFilteredCategory"
          @input=" tempCategory = $event.map(d => d.id); getFilteredCategory('')"
          @blur="$emit('changeSettings', { category: tempCategory })"
        >
          <template slot-scope="props">
            <strong>{{ props.option.id }}</strong> ({{ props.option.name }})
          </template>
          <template slot="empty">
            No difficulties found
          </template>
        </b-taginput>
      </b-field>
      <b-field label="Subcategory">
        <b-taginput
          :value="category"
          :data="filteredSubcategory"
          autocomplete
          openOnFocus
          field="name"
          @typing="getFilteredSubcategory"
          @input="tempSubcategory = $event.map(d => d.id); getFilteredSubcategory('')"
          @blur="$emit('changeSettings', { subcategory: tempSubcategory })"
        >
          <template slot-scope="props">
            <strong>{{ props.option.id }}</strong> ({{ props.option.name }})
          </template>
          <template slot="empty">
            No difficulties found
          </template>
        </b-taginput>
      </b-field>
    </div>
  </div>
</template>

<script>
// import BSlider from 'buefy/src/components/slider/Slider'
// import BSliderTick from 'buefy/src/components/slider/SliderTick'

import BField from 'buefy/src/components/field/Field'
import BTaginput from 'buefy/src/components/taginput/Taginput'

function matches (text, target) {
  return text.length === 0 || target
    .toString()
    .toLowerCase()
    .indexOf(text.toLowerCase()) >= 0
}

export default {
  props: {
    searchFilters: {
      type: Object
    },
    difficulty: {
      type: Array
    },
    category: {
      type: Array
    },
    subcategory: {
      type: Array
    }
  },
  data () {
    return {
      filteredDifficulty: [],
      tempDifficulty: [],
      filteredCategory: [],
      tempCategory: [],
      filteredSubcategory: [],
      tempSubcategory: []
    }
  },
  created () {
    this.filteredDifficulty = this.searchFilters.difficulty.slice()
    this.filteredCategory = this.searchFilters.category.slice()
    this.filteredSubcategory = this.searchFilters.category.slice()
  },
  methods: {
    getFilteredDifficulty (text) {
      console.log('Filtering difficulty')
      this.filteredDifficulty = this.searchFilters.difficulty.filter((option) => {
        return !this.tempDifficulty.includes(option.name) &&
          (option.number === parseInt(text) || matches(text, option.title))
      })
    },
    getFilteredCategory (text) {
      this.filteredCategory = this.searchFilters.category.filter((option) => {
        return !this.tempCategory.includes(option.id) &&
          matches(text, option.name)
      })
    },
    getFilteredSubcategory (text) {
      this.filteredSubcategory = this.searchFilters.subcategory.filter((option) => {
        return !this.tempSubcategory.includes(option.id) &&
          (this.tempCategory.length === 0 || this.tempCategory.includes(option.category_id) || this.category.includes(option.category_id)) &&
          matches(text, option.name)
      })
    }
  },
  components: {
    BField,
    BTaginput
    // BSlider,
    // BSliderTick
  }
}
</script>
