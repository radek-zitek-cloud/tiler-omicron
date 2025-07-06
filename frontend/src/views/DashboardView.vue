<!--
  Dashboard View - Main dashboard page
  
  This view serves as the primary dashboard page that hosts
  the DashboardContainer component. It provides the main
  interface for the tiling system.
-->

<template>
  <div class="dashboard-view">
    <DashboardContainer />
  </div>
</template>

<script setup lang="ts">
import DashboardContainer from '@/components/DashboardContainer.vue';
</script>

<style scoped>
.dashboard-view {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>