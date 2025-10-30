<template>
  <div class="app">
    <AppHeader />
    <AppContainer />
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { provide, watch, nextTick } from "vue";
import { useBingoGames } from "./composables/useBingoGames";
import { useUrlParams } from "./composables/useUrlParams";
import AppHeader from "./components/AppHeader.vue";
import AppFooter from "./components/AppFooter.vue";
import AppContainer from "./components/AppContainer.vue";
import { BINGO_GAMES_KEY } from "./types";

// 获取数据
const { games, metadata, loading, error, refetch } = useBingoGames();

// URL参数管理
const { getGameParam, findGameByName } = useUrlParams();

// 处理URL参数，自动打开对应的绘画模式
const handleUrlParam = async () => {
  const gameParam = getGameParam();
  if (gameParam && games.value.length > 0) {
    const targetGame = findGameByName(games.value, decodeURIComponent(gameParam));
    if (targetGame) {
      // 等待DOM更新后触发自定义事件
      await nextTick();
      window.dispatchEvent(
        new CustomEvent("openGameFromUrl", {
          detail: { game: targetGame },
        })
      );
    } else {
      console.warn(`未找到游戏: ${gameParam}`);
    }
  }
};

// 监听游戏列表加载完成
watch(
  [games, loading],
  ([newGames, newLoading]) => {
    if (!newLoading && newGames.length > 0) {
      handleUrlParam();
    }
  },
  { immediate: true }
);

// 提供数据给子组件
provide(BINGO_GAMES_KEY, {
  games,
  metadata,
  loading,
  error,
  refetch,
});
</script>

<style lang="scss">
.app {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
}
</style>
