<template>
  <div class="bingo-games-list">
    <!-- 头部信息 -->
    <header class="list-header">
      <h1>中文互联网的宾果游戏</h1>
      <p v-if="metadata" class="metadata">
        共收录 <strong>{{ metadata.totalCount }}</strong> 个宾果游戏
        <span class="update-time">更新时间: {{ formatDate(metadata.generatedAt) }}</span>
      </p>
      <!-- 仓库链接与提交入口 -->
      <div v-if="metadata" class="header-actions">
        <a :href="repoUrl" class="repo-link" target="_blank" rel="noopener">
          <span class="sr-only">GitHub 仓库</span>
          <!-- GitHub 标志（内联 SVG） -->
          <svg class="github-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.701-2.782.604-3.369-1.342-3.369-1.342-.455-1.157-1.11-1.466-1.11-1.466-.908-.62.069-.607.069-.607 1.004.071 1.532 1.031 1.532 1.031.892 1.529 2.341 1.087 2.91.832.091-.646.35-1.086.636-1.337-2.221-.253-4.556-1.11-4.556-4.943 0-1.091.39-1.984 1.03-2.683-.103-.253-.447-1.273.098-2.654 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 7.07c.852.004 1.709.115 2.511.337 1.909-1.294 2.748-1.025 2.748-1.025.546 1.381.202 2.401.1 2.654.64.699 1.028 1.592 1.028 2.683 0 3.842-2.338 4.687-4.566 4.935.36.31.68.921.68 1.857 0 1.34-.012 2.42-.012 2.75 0 .268.18.58.688.48C19.138 20.162 22 16.414 22 12 22 6.477 17.523 2 12 2Z" fill="currentColor"/>
          </svg>
          <span class="repo-text">GitHub 仓库</span>
        </a>
        <a :href="newPrUrl" class="pr-button" target="_blank" rel="noopener">提交新宾果</a>
      </div>
    </header>

    <!-- 搜索 -->
    <div class="controls">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索游戏名称或描述..."
          class="search-input"
        />
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner-large"></div>
      <p>正在加载宾果游戏...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="refetch" class="retry-button">重试</button>
    </div>

    <!-- 游戏网格 -->
    <div v-else class="games-grid">
      <BingoGameCard
        v-for="game in filteredGames"
        :key="game.filename"
        :game="game"
      />
    </div>

    <!-- 无结果 -->
    <div v-if="!loading && !error && filteredGames.length === 0" class="no-results">
      <p>没有找到匹配的游戏</p>
    </div>

    <!-- 页脚版权声明 -->
    <footer class="page-footer">
      <div class="copyright-notice">
        <p class="copyright-text">
          图片来源自互联网，版权为其创作者所有。此仓库仅作收集，不对其内容负责。
        </p>
        <p class="commercial-warning">
          <strong>禁止商用</strong>
        </p>
        <p class="disclaimer">
          本站内容仅供娱乐，如有侵权请联系删除。
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBingoGames } from '../composables/useBingoGames';
import BingoGameCard from './BingoGameCard.vue';

const { games, metadata, loading, error, refetch } = useBingoGames();

const searchQuery = ref('');

// 仓库与 PR 跳转链接
const repoUrl = computed(() => metadata.value ? `https://github.com/${metadata.value.repository}` : '#');
const newPrUrl = computed(() => metadata.value ? `https://github.com/${metadata.value.repository}/discussions/1` : '#');

// 筛选后的游戏列表（只保留搜索功能）
const filteredGames = computed(() => {
  let filtered = games.value;

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(game => 
      game.gameName.toLowerCase().includes(query) ||
      game.description.toLowerCase().includes(query)
    );
  }

  // 默认按名称排序
  filtered.sort((a, b) => a.gameName.localeCompare(b.gameName, 'zh-CN'));

  return filtered;
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};
</script>

<style scoped>
.bingo-games-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.list-header {
  text-align: center;
  margin-bottom: 32px;
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
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
}

.loading-state,
.error-state,
.no-results {
  text-align: center;
  padding: 64px 20px;
  color: #666;
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
}

.retry-button:hover {
  background: #0056b3;
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

/* 页脚样式 */
.page-footer {
  margin-top: 64px;
  padding: 32px 20px;
  border-top: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.copyright-notice {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.copyright-text,
.commercial-warning,
.disclaimer {
  margin: 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

.commercial-warning {
  font-size: 13px;
  color: #d73527;
}

.commercial-warning strong {
  font-weight: 600;
}

.disclaimer {
  font-size: 11px;
  color: #888;
  margin-top: 12px;
}

@media (max-width: 768px) {
  .page-footer {
    margin-top: 48px;
    padding: 24px 16px;
  }
  
  .copyright-text,
  .commercial-warning,
  .disclaimer {
    font-size: 11px;
  }
  
  .commercial-warning {
    font-size: 12px;
  }
}
</style>