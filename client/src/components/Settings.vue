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
          :value="value.searchFilters.difficulty"
          :options="filterOptions.difficulty"
          idField="name"
          dispField="title"
          numberField="number"

          label="Difficulty"

          @input="$emit('changeSearchFilters', { difficulty: $event })"
        ></filter-option>

        <filter-option
          :value="value.searchFilters.category"
          :options="filterOptions.category"
          idField="id"
          dispField="name"
          numberField="id"

          label="Category"

          @input="$emit('changeSearchFilters', { category: $event })"
        ></filter-option>
      </section>

      <!-- <b-field label="Subcategory">
        <b-taginput
          :value="subcategoryObjs"
          :data="filteredSubcategory"
          autocomplete
          openOnFocus
          field="name"
          @typing="getFilteredSubcategory"
          @input="tempSubcategory = $event.map(d => d.id); getFilteredSubcategory('')"
          @blur="$emit('changefilterOptions', { subcategory: tempSubcategory })"
        >
          <template slot-scope="props">
            <strong>{{ props.option.id }}</strong> ({{ props.option.name }})
          </template>
          <template slot="empty">
            No difficulties found
          </template>
        </b-taginput>
      </b-field> -->
    </div>
  </div>
</template>

<script>
import BField from 'buefy/src/components/field/Field'
import BSlider from 'buefy/src/components/slider/Slider'
// import BSliderTick from 'buefy/src/components/slider/SliderTick'
// import BInput from 'buefy/src/components/input/Input'

import FilterOption from './FilterOption'

export default {
  props: {
    value: Object,
    filterOptions: Object
  },
  methods: {
    subcategoryCheck (option) {
      this.tempCategory.length === 0 || this.tempCategory.includes(option.category_id) || this.category.includes(option.category_id)
    }
  },
  components: {
    FilterOption,
    BField,
    BSlider
    // BSliderTick,
    // BInput
  }
}
</script>
