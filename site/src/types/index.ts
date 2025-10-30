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