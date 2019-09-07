<template>
  <section>
    <b-field grouped label="Delay">
      <b-field expanded>
        <b-slider v-model="wordDelay" :min="25" :max="500" lazy></b-slider>
      </b-field>
      <b-field>
        <b-input v-model.lazy="wordDelay" type="number" :min="25" :max="500"></b-input>
      </b-field>
    </b-field>
    <b-field grouped label="WPM">
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
    </b-field>
  </section>
</template>
