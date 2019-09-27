<template functional>
  <p
    :class="[
      data.class,
      data.staticClass
    ]">
    {{ props.message }}
  </p>
</template>
