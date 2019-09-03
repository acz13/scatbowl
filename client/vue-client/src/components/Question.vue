<template>
  <div class="question card">
    <p class="card-header-title">Component</p>
  </div>
</template>

<script>
export default {
  name: "Question",
  props: {
    formattedText: {
      type: String,
      required: true
    },
  
  }
};
</script>