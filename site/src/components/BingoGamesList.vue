<template>
  <main class="bingo-games-list">
    <!-- 搜索 -->
    <div class="controls">
      <div class="search-box">
        <input v-model="searchQuery" type="text" placeholder="搜索游戏名称或描述..." class="search-input" />
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner-large"></div>
      <p>正在加载宾果游戏...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p class="error-text">加载失败：{{ error }}</p>
      <p class="error-hint">可尝试切换镜像来重新加载</p>
      <div class="error-actions">
        <button @click="refetch" class="retry-button">重试</button>
        <button @click="focusMirrorSelect" class="mirror-button">切换镜像</button>
      </div>
    </div>

    <!-- 游戏网格 -->
    <div v-else class="games-grid">
      <BingoGameCard v-for="game in filteredGames" :key="game.filename" :game="game" />
    </div>

    <!-- 无结果 -->
    <div v-if="!loading && !error && filteredGames.length === 0" class="no-results">
      <p>没有找到匹配的游戏</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, inject } from "vue";
import BingoGameCard from "./BingoGameCard.vue";
import { BINGO_GAMES_KEY } from "../types";

// 通过 inject 获取数据
const bingoGamesContext = inject(BINGO_GAMES_KEY);

if (!bingoGamesContext) {
  throw new Error("BingoGamesList must be used within a component that provides BINGO_GAMES_KEY");
}

const { games, loading, error, refetch } = bingoGamesContext;

const searchQuery = ref("");

// 引导用户切换镜像：定位并聚焦到 AppHeader 内的镜像选择器
const focusMirrorSelect = () => {
  const selectEl = document.getElementById("mirror-select");
  if (selectEl) {
    // 滚动到视图中央并聚焦
    selectEl.scrollIntoView({ behavior: "smooth", block: "center" });
    (selectEl as HTMLSelectElement).focus();

    // 高亮其容器以增强视觉引导
    const container = selectEl.closest(".mirror-selector");
    if (container) {
      container.classList.add("attention-blink");
      setTimeout(() => container.classList.remove("attention-blink"), 2000);
    }
  }
};

// 筛选后的游戏列表（只保留搜索功能）
const filteredGames = computed(() => {
  let filtered = games.value;

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((game) => game.gameName.toLowerCase().includes(query) || game.description.toLowerCase().includes(query));
  }

  // 默认按名称排序
  filtered.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

  return filtered;
});
</script>

<style lang="scss" scoped>
.bingo-games-list {
  width: 100%;
  height: 100%;
}

.controls {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.search-box {
  width: 100%;
  max-width: 500px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #007bff;
  }
}

.loading-state,
.error-state,
.no-results {
  text-align: center;
  padding: 64px 20px;
  color: #666;
}

.error-text {
  margin-bottom: 8px;
}

.error-hint {
  margin: 0 auto 16px;
  max-width: 680px;
  color: #888;
  font-size: 14px;
}

.error-actions {
  display: inline-flex;
  gap: 12px;
}

.spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.retry-button {
  margin-top: 16px;
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #0056b3;
  }
}

.mirror-button {
  margin-top: 16px;
  padding: 12px 24px;
  background: #fff;
  color: #007bff;
  border: 1px solid #007bff;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
  }
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

@media (max-width: 768px) {
  .search-box {
    max-width: none;
  }

  .games-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
}

/* 全局：镜像选择器的临时高亮效果 */
:global(.mirror-selector.attention-blink) {
  border: 1px solid #007bff !important;
  box-shadow: 0 0 0 6px rgba(0, 123, 255, 0.15);
}
</style>
