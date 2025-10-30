import { ref, onMounted } from 'vue';
import type { BingoGamesList, BingoGame } from '../types';

export function useBingoGames() {
  const games = ref<BingoGame[]>([]);
  const metadata = ref<BingoGamesList['metadata'] | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchGames = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      // 从项目根目录获取JSON数据
      const response = await fetch(import.meta.env.VITE_BINGO_GAMES_RESOURCE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: BingoGamesList = await response.json();
      games.value = data.games.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
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
    refetch: fetchGames
  };
}