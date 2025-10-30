<template>
  <header class="list-header">
    <h1>中文互联网的宾果游戏</h1>
    <p v-if="bingoGamesContext.metadata" class="metadata">
      共收录 <strong>{{ bingoGamesContext.metadata.value?.totalCount }}</strong> 个宾果游戏
      <span class="update-time">更新时间: {{ bingoGamesContext.metadata.value?.generatedAt }}</span>
    </p>
    <!-- 仓库链接与提交入口 -->
    <div v-if="bingoGamesContext.metadata" class="header-actions">
      <a :href="repoUrl" class="repo-link" target="_blank" rel="noopener">
        <span class="sr-only">GitHub 仓库</span>
        <!-- GitHub 标志（内联 SVG） -->
        <svg class="github-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.701-2.782.604-3.369-1.342-3.369-1.342-.455-1.157-1.11-1.466-1.11-1.466-.908-.62.069-.607.069-.607 1.004.071 1.532 1.031 1.532 1.031.892 1.529 2.341 1.087 2.91.832.091-.646.35-1.086.636-1.337-2.221-.253-4.556-1.11-4.556-4.943 0-1.091.39-1.984 1.03-2.683-.103-.253-.447-1.273.098-2.654 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 7.07c.852.004 1.709.115 2.511.337 1.909-1.294 2.748-1.025 2.748-1.025.546 1.381.202 2.401.1 2.654.64.699 1.028 1.592 1.028 2.683 0 3.842-2.338 4.687-4.566 4.935.36.31.68.921.68 1.857 0 1.34-.012 2.42-.012 2.75 0 .268.18.58.688.48C19.138 20.162 22 16.414 22 12 22 6.477 17.523 2 12 2Z"
            fill="currentColor"
          />
        </svg>
        <span class="repo-text">GitHub 仓库</span>
      </a>
      <a href="https://lab.magiconch.com/bingo/" class="pr-button plain" target="_blank" rel="noopener">创建新宾果</a>
      <a :href="newPrUrl" class="pr-button" target="_blank" rel="noopener">提交新宾果</a>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";
import { BINGO_GAMES_KEY } from "../types";

// 通过 inject 获取数据
const bingoGamesContext = inject(BINGO_GAMES_KEY);

if (!bingoGamesContext) {
  throw new Error("BingoGamesList must be used within a component that provides BINGO_GAMES_KEY");
}

// 仓库与 PR 跳转链接
const repoUrl = computed(() => (bingoGamesContext?.metadata ? `https://github.com/${bingoGamesContext?.metadata.value?.repository}` : "#"));
const newPrUrl = computed(() =>
  bingoGamesContext?.metadata ? `https://github.com/${bingoGamesContext?.metadata.value?.repository}/discussions/1` : "#"
);
</script>

<style lang="scss" scoped>
.list-header {
  text-align: center;
  margin: 80px 0;
}

.list-header h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
  color: #333;
}

.metadata {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.metadata strong {
  color: #007bff;
}

.update-time {
  margin-left: 16px;
  font-size: 14px;
}

/* 仓库链接与按钮 */
.header-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.repo-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #333;
  text-decoration: none;
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  transition: all 0.2s ease;
}

.repo-link:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
}

.github-icon {
  width: 20px;
  height: 20px;
}

.repo-text {
  font-size: 14px;
}

.pr-button {
  display: inline-block;
  padding: 6px 16px;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.2s ease;
  &.plain {
    background: #fff;
    color: #007bff;
    border: 1px solid #007bff;
    &:hover {
      background: #f5f5f5;
    }
  }
}

.pr-button:hover {
  background: #0056b3;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
