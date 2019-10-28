<template functional>
  <p
    :class="[
      data.class,
      data.staticClass,
    ]">
    <b>{{ props.sender }}</b> {{ props.text }}
  </p>
</template>
