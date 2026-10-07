<template>
  <div></div>
</template>

<script setup lang="ts">
import { navigateTo } from '#imports';

definePageMeta({
  hidden: true
});

await navigateTo('/modules/teamspeak/overview', { replace: true });
</script>
