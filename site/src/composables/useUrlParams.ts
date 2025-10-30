import { ref, onMounted, onUnmounted } from 'vue';

export function useUrlParams() {
  const currentGameParam = ref<string | null>(null);

  // 获取URL中的game参数
  const getGameParam = (): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('game');
  };

  // 设置URL中的game参数
  const setGameParam = (gameName: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('game', encodeURIComponent(gameName));
    
    // 使用pushState更新URL，不会触发页面刷新
    window.history.pushState({ game: gameName }, '', url.toString());
    currentGameParam.value = gameName;
  };

  // 清除URL中的game参数
  const clearGameParam = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('game');
    
    // 使用pushState更新URL
    window.history.pushState({}, '', url.toString());
    currentGameParam.value = null;
  };

  // 监听浏览器前进/后退事件
  const handlePopState = () => {
    const gameParam = getGameParam();
    currentGameParam.value = gameParam;
    
    // 触发自定义事件，让其他组件知道URL参数发生了变化
    window.dispatchEvent(new CustomEvent('gameParamChanged', { 
      detail: { game: gameParam } 
    }));
  };

  // 从文件名提取游戏名（去掉扩展名）
  const getGameNameFromFilename = (filename: string): string => {
    return filename.replace(/\.[^/.]+$/, ''); // 去掉文件扩展名
  };

  // 根据游戏名查找对应的游戏对象
  const findGameByName = (games: any[], gameName: string) => {
    return games.find((game: any) => 
      getGameNameFromFilename(game.filename) === gameName
    );
  };

  onMounted(() => {
    // 初始化时读取URL参数
    currentGameParam.value = getGameParam();
    
    // 监听popstate事件
    window.addEventListener('popstate', handlePopState);
  });

  onUnmounted(() => {
    // 清理事件监听器
    window.removeEventListener('popstate', handlePopState);
  });

  return {
    currentGameParam,
    getGameParam,
    setGameParam,
    clearGameParam,
    getGameNameFromFilename,
    findGameByName
  };
}