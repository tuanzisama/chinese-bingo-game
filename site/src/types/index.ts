// 宾果游戏数据类型定义
export interface BingoGame {
  filename: string;
  gameName: string;
  description: string;
  fileSize: number;
  fileSizeFormatted: string;
  githubUrl: string;
  extension: string;
  createdAt: string;
  lastModified: string;
}

export interface BingoGamesList {
  metadata: {
    totalCount: number;
    generatedAt: string;
    repository: string;
    branch: string;
  };
  games: BingoGame[];
}

// Provide/Inject 数据接口
export interface BingoGamesContext {
  games: Ref<BingoGame[]>;
  metadata: Ref<BingoGamesList['metadata'] | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  refetch: () => Promise<void>;
}

// Provide/Inject 的 key
export const BINGO_GAMES_KEY = Symbol('bingoGames') as InjectionKey<BingoGamesContext>;

// 导入 Vue 类型
import type { Ref, InjectionKey } from 'vue';