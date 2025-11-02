import { ref, onMounted } from 'vue';
import type { BingoGamesList, BingoGame } from '../types';
import { useMirrorProxy } from './useMirrorProxy';

export function useBingoGames() {
  const games = ref<BingoGame[]>([]);
  const metadata = ref<BingoGamesList['metadata'] | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 使用镜像代理
  const { transformUrl, transformGitHubRawUrl } = useMirrorProxy();

  const fetchGames = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      // 使用镜像代理转换URL
      const originalUrl = import.meta.env.VITE_BINGO_GAMES_RESOURCE_URL;
      const proxyUrl = transformUrl(originalUrl);

      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: BingoGamesList = await response.json();
      
      // 转换游戏数据中的GitHub URL为镜像URL
      const gamesWithProxyUrls = data.games.map(game => ({
        ...game,
        githubUrl: transformGitHubRawUrl(game.githubUrl)
      }));
      
      games.value = gamesWithProxyUrls;
      metadata.value = data.metadata;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取数据失败';
      console.error('Failed to fetch bingo games:', err);
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchGames();
  });

  return {
    games,
    metadata,
    loading,
    error,
    fetchGames, // 暴露fetchGames方法以便重新获取数据
    refetch: fetchGames // 提供一个别名
  };
}