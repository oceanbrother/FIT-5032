<script setup>
import { ref, onMounted } from 'vue'

const hikes = ref([])
const error = ref('')

onMounted(async () => {
  try {
    const res = await fetch('/hikes.json', { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to load hikes.json')
    const data = await res.json()
    hikes.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error(err)
    error.value = 'Failed to load hikes.json, showing fallback.'
    // fallback data
    hikes.value = [
      { id: 1, name: 'Royal Botanic Loop (fallback)', location: 'Melbourne CBD', difficulty: 'Easy' }
    ]
  }
})
</script>

<template>
  <div class="container py-4">
    <h1 class="mb-3">Hikes</h1>

    <!-- Reminder -->
    <p v-if="error" class="text-danger">{{ error }}</p>

    <!-- Data List -->
    <ul v-if="hikes.length">
      <li v-for="h in hikes" :key="h.id">
        <strong>{{ h.name }}</strong> — {{ h.location }} ({{ h.difficulty }})
      </li>
    </ul>

    <!-- Loading or No Data -->
    <p v-else class="text-muted">Loading...</p>
  </div>
</template>

<style scoped>
.container { max-width: 720px; }
</style>
