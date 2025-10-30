<template>
  <div class="bingo-card" @click="openDrawingModal">
    <div class="card-image">
      <img
        ref="imageRef"
        :alt="game.gameName"
        :class="{
          loading: isLoading,
          error: hasError,
          loaded: isLoaded,
        }"
      />
      <div v-if="isLoading" class="loading-placeholder">
        <div class="spinner"></div>
        <span class="loading-text">加载中...</span>
      </div>
      <div v-if="hasError" class="error-placeholder">
        <span>图片加载失败</span>
        <button @click.stop="retryLoad" class="retry-btn">重试</button>
      </div>
      <!-- 绘画模式提示 -->
      <div class="drawing-hint">
        <span class="hint-icon">🎨</span>
        <span class="hint-text">点击进入绘画模式</span>
      </div>
    </div>

    <div class="card-content">
      <h3 class="game-title">{{ game.gameName }}</h3>
      <p v-if="game.description" class="game-description">{{ game.description }}</p>
      <div class="game-meta">
        <span class="file-size">{{ game.fileSizeFormatted }}</span>
        <span class="file-type">{{ game.extension.toLowerCase() }}</span>
      </div>
      <div class="game-dates">
        <small>最后更新时间: {{ game.lastModified }}</small>
      </div>
    </div>
  </div>

  <!-- 绘画弹窗 -->
  <BingoDrawingModal v-if="showDrawingModal" :is-visible="true" :game="props.game" @close="closeDrawingModal" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import type { BingoGame } from "../types";
import { useLazyImage } from "../composables/useLazyImage";
import { useUrlParams } from "../composables/useUrlParams";
import BingoDrawingModal from "./BingoDrawingModal.vue";

interface Props {
  game: BingoGame;
}

const props = defineProps<Props>();

const imageRef = ref<HTMLImageElement | null>(null);
const showDrawingModal = ref(false);

// 使用URL参数管理
const { setGameParam, getGameNameFromFilename } = useUrlParams();

// 使用懒加载composable
const { isLoaded, isLoading, hasError, loadImage, setSrc } = useLazyImage(imageRef, props.game.githubUrl, {
  rootMargin: "100px", // 提前100px开始加载
  threshold: 0.1,
});

// 当镜像切换导致githubUrl更新时，重载图片
watch(
  () => props.game.githubUrl,
  (newUrl, oldUrl) => {
    if (newUrl && newUrl !== oldUrl) {
      setSrc(newUrl);
    }
  }
);

// 重试加载功能
const retryLoad = () => {
  loadImage();
};

// 打开绘画弹窗
const openDrawingModal = () => {
  if (isLoaded.value && !hasError.value) {
    showDrawingModal.value = true;
    // 设置URL参数
    const gameName = getGameNameFromFilename(props.game.filename);
    setGameParam(gameName);
  }
};

// 关闭绘画弹窗
const closeDrawingModal = () => {
  showDrawingModal.value = false;
};

// 监听从URL打开游戏的事件
const handleOpenGameFromUrl = (event: CustomEvent) => {
  const { game } = event.detail;
  if (game && game.filename === props.game.filename) {
    // 确保图片已加载
    if (isLoaded.value && !hasError.value) {
      showDrawingModal.value = true;
    } else {
      // 如果图片还没加载，等待加载完成
      const checkLoaded = () => {
        if (isLoaded.value && !hasError.value) {
          showDrawingModal.value = true;
        } else if (!hasError.value) {
          // 继续等待
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    }
  }
};

onMounted(() => {
  // 监听从URL打开游戏的事件
  window.addEventListener("openGameFromUrl", handleOpenGameFromUrl as EventListener);
});

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener("openGameFromUrl", handleOpenGameFromUrl as EventListener);
});
</script>

<style lang="scss" scoped>
.bingo-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

    .drawing-hint {
      opacity: 1;
    }
  }
}

.card-image {
  position: relative;
  width: 100%;
  height: 100px;
  overflow: hidden;
  background: #f5f5f5;
  position: relative;

  &:after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    display: block;
    width: 100%;
    height: 80%;
    background: linear-gradient(180deg, rgba(245, 245, 245, 0) 20%, rgba(245, 245, 245, 0.95) 100%);
  }

  img {
    width: 100%;
    height: auto;
    /* height: 100%;
    object-fit: cover; */
    transition: opacity 0.3s ease, transform 0.3s ease;
    opacity: 0;

    &.loading {
      opacity: 0;
    }

    &.loaded {
      opacity: 1;
    }

    &.error {
      display: none;
    }
  }
}

.loading-placeholder,
.error-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  gap: 8px;
}

.loading-text {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.retry-btn {
  margin-top: 8px;
  padding: 4px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #0056b3;
  }
}

.drawing-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.hint-icon {
  font-size: 14px;
}

.hint-text {
  white-space: nowrap;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e0e0e0;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.error-placeholder {
  color: #666;
  font-size: 14px;
}

.card-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.game-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
}

.game-description {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
  flex: 1;
}

.game-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.file-size,
.file-type {
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.file-type {
  background: #e3f2fd;
  color: #1976d2;
}

.game-dates {
  color: #999;
  font-size: 12px;
}
</style>
