<template>
  <div class="app-container">
    <BingoGamesList />
  </div>
</template>

<script setup lang="ts">
import BingoGamesList from "./BingoGamesList.vue";
</script>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
</style>
