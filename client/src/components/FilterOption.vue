<template>
  <b-field :label="label">
    <b-taginput
      :value="objValue"
      :data="filteredOptions"
      autocomplete
      openOnFocus
      :field="dispField"
      @typing="getFilteredOptions"
      @input="temp = $event.map(d => d[idField]); getFilteredOptions(''); $emit('input', temp)"
    >
      <template slot-scope="props">
        <strong>{{ props.option[numberField] }}</strong> ({{ props.option[dispField] }})
      </template>
      <template slot="empty">
        No difficulties found
      </template>
    </b-taginput>
  </b-field>
</template>

<script>
import { ref, computed, watch } from '@vue/composition-api'

import BField from 'buefy/src/components/field/Field'
import BTaginput from 'buefy/src/components/taginput/Taginput'

function matches (text, target) {
  return text.length === 0 || target
    .toString()
    .toLowerCase()
    .indexOf(text.toLowerCase()) >= 0
}

export default {
  name: 'FilterOption',
  props: {
    value: Array,
    options: Array,
    idField: String,
    dispField: String,
    numberField: String,
    extraCondition: Function,
    label: String,
    watched: Array
  },
  setup (props) {
    const optionsMap = computed(() => {
      return Object.fromEntries(props.options.map(o => [o[props.idField], o]))
    })

    const objValue = computed(() => {
      return props.value.map(id => optionsMap.value[id])
    })

    console.log(optionsMap)

    const filteredOptions = ref(props.options.slice())
    const temp = ref([])

    watch(props.value, () => {
      temp.value = props.value
    })

    function getFilteredOptions (text) {
      text = typeof text === 'string' ? text : ''

      filteredOptions.value = props.options.filter((option) => {
        return !temp.value.includes(option[props.idField]) &&
          (option[props.numberField] === parseInt(text) || matches(text, option[props.dispField])) &&
          props.extraCondition(option)
      })
    }

    return {
      objValue,
      filteredOptions,
      temp,
      getFilteredOptions
    }
  },
  components: {
    BField,
    BTaginput
  }
}
</script>
