<template>
  <div
    :class="[
      'bg-white rounded-lg shadow-md p-6 border border-gray-100 transition-all duration-200',
      hoverable ? 'hover:shadow-lg hover:-translate-y-0.5' : ''
    ]"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({
  hoverable: {
    type: Boolean,
    default: false
  }
});
</script>
