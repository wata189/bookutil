<script setup lang="ts">

const props = defineProps({
  appear: {type: Boolean, default: false},
  enter: {type: String, required: true},
  leave: {type: String, required: true},
});

const PREFIX = "animate__";
const ANIMATED = `${PREFIX}animated`;

const enterClasses = [ANIMATED, PREFIX + props.enter];
const leaveClasses = [ANIMATED, PREFIX + props.leave];

</script>

<template>
  <Transition
    :appear="props.appear"
    :enter-active-class="enterClasses.join(' ')"
    :leave-active-class="leaveClasses.join(' ')"
  >
    <slot></slot>
  </Transition>
</template>