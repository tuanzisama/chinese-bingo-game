<template>
  <header class="list-header">
    <h1>中文互联网的宾果游戏</h1>
    <div class="metadata" v-if="bingoGamesContext.metadata.value">
      <span>
        当前共收录 <strong>{{ bingoGamesContext.metadata.value.totalCount }}</strong> 个游戏
      </span>
      <span>✨</span>
      <span>最后更新：{{ bingoGamesContext.metadata.value.generatedAt }}</span>
    </div>
    <div class="actions">
      <section class="action-section">
        <a :href="repoUrl" target="_blank" rel="noopener noreferrer" class="repo-link" title="查看源代码">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
            />
          </svg>
        </a>
        <div class="mirror-selector">
          <select id="mirror-select" v-model="selectedMirrorId" @change="onMirrorChange" class="mirror-select">
            <option v-for="(mirror, index) in MIRROR_CONFIGS" :key="index" :value="mirror.id">
              {{ mirror.name }}
            </option>
          </select>
        </div>
      </section>
      <section class="action-section">
        <a href="https://lab.magiconch.com/bingo/" class="pr-button plain" target="_blank" rel="noopener">创建新宾果</a>
        <a :href="prUrl" target="_blank" rel="noopener noreferrer" class="pr-button"> 提交新宾果 </a>
      </section>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";
import { BINGO_GAMES_KEY } from "../types";
import { useMirrorProxy, MIRROR_CONFIGS } from "../composables/useMirrorProxy";

// 通过 inject 获取数据
const bingoGamesContext = inject(BINGO_GAMES_KEY);

if (!bingoGamesContext) {
  throw new Error("BingoGamesList must be used within a component that provides BINGO_GAMES_KEY");
}

// 镜像代理功能
const { selectedMirrorId, setMirror } = useMirrorProxy();

// 镜像切换处理
const onMirrorChange = async (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  setMirror(value);
  await bingoGamesContext.refetch();
};

// 仓库与 PR 跳转链接
const repoUrl = computed(() => (bingoGamesContext?.metadata ? `https://github.com/${bingoGamesContext?.metadata.value?.repository}` : "#"));
const prUrl = computed(() =>
  bingoGamesContext?.metadata ? `https://github.com/${bingoGamesContext?.metadata.value?.repository}/discussions/1` : "#"
);
</script>

<style lang="scss" scoped>
.list-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

  h1 {
    margin: 0 0 1rem 0;
    font-size: 2.5rem;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .metadata {
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
    opacity: 0.9;

    strong {
      font-weight: 600;
      color: #007bff;
    }
  }

  .actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;

    .action-section {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .mirror-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-radius: 8px;
      backdrop-filter: blur(10px);
      border: 1px solid #e0e0e0;
      transition: all 0.2s ease;
      background: white;

      label {
        font-size: 0.9rem;
        font-weight: 500;
        white-space: nowrap;
      }

      .mirror-select {
        color: #333;
        border: none;
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        font-size: 0.9rem;
        cursor: pointer;
      }

      &:hover {
        border: 1px solid #007bff;
      }
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
      background: #fff;

      &:hover {
        border-color: #000;
      }
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
      padding: 8px 12px;
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

      &:hover {
        background: #0056b3;
      }
    }
  }
}

@media (max-width: 768px) {
  .list-header {
    padding: 1.5rem 1rem;

    h1 {
      font-size: 2rem;
    }

    .actions {
      flex-direction: column;
      gap: 0.75rem;

      .mirror-selector {
        width: 100%;
        justify-content: center;
      }
    }
  }
}
</style>
