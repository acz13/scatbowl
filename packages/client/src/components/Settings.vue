<template>
  <div class="card">
    <div class="card-header">
      <p class="card-header-title">Settings</p>
    </div>
    <div class="card-content">
      <b-field grouped label="Delay">
        <b-field expanded>
          <b-slider :value="value.wordDelay" @change="$emit('changeSettings', { wordDelay: $event })" :min="25" :max="500" lazy></b-slider>
        </b-field>
        <!-- <b-field>
          <b-input :value="value.wordDelay" @input="$emit('changeSettings', { wordDelay: $event })" type="number" :min="25" :max="500"></b-input>
        </b-field> -->
      </b-field>
      <b-field grouped label="WPM">
        <b-field expanded>
          <b-slider
            :value="Math.round(60000 / value.wordDelay)"
            @change="$emit('changeSettings', { wordDelay: Math.round(60000 / $event) })"
            :min="120"
            :max="2400"
            lazy
          ></b-slider>
        </b-field>
        <!-- <b-field>
          <b-input
            :value="Math.round(60000 / value.wordDelay)"
            @input="$emit('changeSettings', { wordDelay: Math.round(60000 / $event) })"
            type="number"
            :min="120"
            :max="2400"
          ></b-input>
        </b-field> -->
      </b-field>

      <section>
        <filter-option
          :value="tempSearchFilters.difficulty"
          :options="filterOptions.difficulty"
          idField="name"
          dispField="title"
          numberField="number"

          :extraCondition="() => true"

          label="Difficulty"

          @input="searchFiltersChanged = true; tempSearchFilters.difficulty = $event"
        ></filter-option>

        <filter-option
          :value="tempSearchFilters.category"
          :options="filterOptions.category"
          idField="id"
          dispField="name"
          numberField="id"

          :extraCondition="() => true"

          label="Category"

          @input="searchFiltersChanged = true; tempSearchFilters.category = $event"
        ></filter-option>

        <filter-option
          :value="tempSearchFilters.subcategory"
          :options="filterOptions.subcategory"
          idField="id"
          dispField="name"
          numberField="id"

          :watched="tempSearchFilters.category"
          :extraCondition="subcategoryCheck"

          label="Subcategory"

          @input="searchFiltersChanged = true; tempSearchFilters.subcategory = $event"
        ></filter-option>

        <b-button v-show="searchFiltersChanged" @click="searchFiltersChanged = false; $emit('changeSearchFilters', tempSearchFilters)">
          Apply
        </b-button>
      </section>
    </div>
  </div>
</template>

<script>
import BField from 'buefy/src/components/field/Field'
import BSlider from 'buefy/src/components/slider/Slider'
import BButton from 'buefy/src/components/button/Button'

// import BSliderTick from 'buefy/src/components/slider/SliderTick'
// import BInput from 'buefy/src/components/input/Input'

import FilterOption from './FilterOption'

export default {
  props: {
    value: Object,
    filterOptions: Object
  },
  data () {
    return {
      searchFiltersChanged: false,
      tempSearchFilters: this.value.searchFilters
    }
  },
  watch: {
    value () {
      this.tempSearchFilters = this.value.searchFilters
      this.searchFiltersChanged = true
    }
  },
  methods: {
    subcategoryCheck (option) {
      return this.tempSearchFilters.category.length === 0 ||
        this.tempSearchFilters.category.includes(option.category_id)
    }
  },
  components: {
    FilterOption,
    BField,
    BSlider,
    BButton
    // BSliderTick,
    // BInput
  }
}
</script>
