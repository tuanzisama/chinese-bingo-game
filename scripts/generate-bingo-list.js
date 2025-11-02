const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const BINGO_GAMES_DIR = './bingo-games';
const OUTPUT_FILE = './bingo-games-list.json';
const MAPPINGS_FILE = './bingo-games/mappings.json';
const GITHUB_REPO = process.env.GITHUB_REPOSITORY || 'tuanzisama/chinese-bingo-game';
const GITHUB_BRANCH = process.env.GITHUB_REF_NAME || 'main';

// 支持的图片格式
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];

/**
 * 获取文件大小（字节）
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`Error getting file size for ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 生成GitHub外链地址
 */
function generateGitHubUrl(filename) {
  return `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/bingo-games/${encodeURIComponent(filename)}`;
}

/**
 * 获取文件的Git时间信息
 */
function getGitFileInfo(filePath) {
  try {
    const relativePath = path.relative('.', filePath).replace(/\\/g, '/');

    // 获取文件的首次提交时间（创建时间）
    let createdAt = null;
    try {
      const firstCommitCmd = `git log --follow --format="%ai" --reverse -- "${relativePath}"`;
      const firstCommitOutput = execSync(firstCommitCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const firstCommitLine = firstCommitOutput.trim().split('\n')[0];
      if (firstCommitLine) {
        createdAt = new Date(firstCommitLine).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
      }
    } catch (error) {
      // 如果获取失败，使用文件系统创建时间作为备选
      const stats = fs.statSync(filePath);
      createdAt = stats.birthtime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    }

    // 获取文件的最后修改时间（最后一次提交时间）
    let lastModified = null;
    try {
      const lastCommitCmd = `git log -1 --format="%ai" -- "${relativePath}"`;
      const lastCommitOutput = execSync(lastCommitCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lastCommitLine = lastCommitOutput.trim();
      if (lastCommitLine) {
        lastModified = new Date(lastCommitLine).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
      }
    } catch (error) {
      // 如果获取失败，使用文件系统修改时间作为备选
      const stats = fs.statSync(filePath);
      lastModified = stats.mtime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    }

    return {
      createdAt,
      lastModified,
    };
  } catch (error) {
    // 如果Git命令完全失败，返回文件系统时间
    try {
      const stats = fs.statSync(filePath);
      return {
        createdAt: stats.birthtime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        lastModified: stats.mtime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
      };
    } catch (fsError) {
      return {
        createdAt: null,
        lastModified: null,
      };
    }
  }
}

/**
 * 检查是否在Git仓库中
 */
function isGitRepository() {
  try {
    execSync('git rev-parse --git-dir', { stdio: ['pipe', 'pipe', 'ignore'] });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 读取mappings.json文件获取描述信息
 */
function loadMappings() {
  try {
    if (fs.existsSync(MAPPINGS_FILE)) {
      const mappingsContent = fs.readFileSync(MAPPINGS_FILE, 'utf8');
      const mappings = JSON.parse(mappingsContent);

      // 创建一个Map用于快速查找
      const mappingsMap = new Map();
      mappings.forEach(item => {
        mappingsMap.set(item.fileName, item.description || '');
      });

      return mappingsMap;
    } else {
      console.warn(`⚠️  Mappings file ${MAPPINGS_FILE} not found. Descriptions will be empty.`);
      return new Map();
    }
  } catch (error) {
    console.error(`❌ Error reading mappings file: ${error.message}`);
    return new Map();
  }
}

/**
 * 检查是否为图片文件
 */
function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * 读取bingo-games目录并生成JSON
 */
function generateBingoGamesList() {
  try {
    // 检查目录是否存在
    if (!fs.existsSync(BINGO_GAMES_DIR)) {
      console.error(`Directory ${BINGO_GAMES_DIR} does not exist!`);
      process.exit(1);
    }

    // 检查是否在Git仓库中
    const isGitRepo = isGitRepository();
    if (!isGitRepo) {
      console.warn('⚠️  Not in a Git repository. File timestamps will use filesystem dates.');
    }

    // 加载mappings文件
    console.log('📖 Loading mappings file...');
    const mappingsMap = loadMappings();
    console.log(`📋 Loaded ${mappingsMap.size} mappings`);

    // 读取目录内容
    const files = fs.readdirSync(BINGO_GAMES_DIR);

    console.log(`📁 Processing ${files.filter(isImageFile).length} image files...`);

    // 过滤图片文件并生成信息
    const bingoGames = files
      .filter(isImageFile)
      .map((filename, index) => {
        const filePath = path.join(BINGO_GAMES_DIR, filename);
        const fileSize = getFileSize(filePath);
        const githubUrl = generateGitHubUrl(filename);

        // 从文件名提取游戏名称（去掉扩展名）
        const gameName = path.parse(filename).name;

        // 获取Git时间信息
        console.log(`  Processing ${index + 1}/${files.filter(isImageFile).length}: ${gameName}`);
        const gitInfo = isGitRepo ? getGitFileInfo(filePath) : {
          createdAt: null,
          lastModified: null,
          commitCount: 0
        };

        // 从mappings中获取描述信息
        const description = mappingsMap.get(filename) || '';

        return {
          filename: filename,
          gameName: gameName,
          description: description,
          fileSize: fileSize,
          fileSizeFormatted: formatFileSize(fileSize),
          githubUrl: githubUrl,
          extension: path.extname(filename).toLowerCase(),
          // 新增的时间信息
          createdAt: gitInfo.createdAt,
          lastModified: gitInfo.lastModified,
          commitCount: gitInfo.commitCount,
        };
      })
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()); // 按最后修改时间排序

    // 计算时间统计信息
    const gamesWithGitInfo = bingoGames.filter(game => game.createdAt && game.lastModified);
    const newestGame = gamesWithGitInfo.length > 0 ?
      gamesWithGitInfo.reduce((newest, game) =>
        new Date(game.lastModified) > new Date(newest.lastModified) ? game : newest
      ) : null;

    // 生成最终的JSON结构
    const result = {
      metadata: {
        totalCount: bingoGames.length,
        generatedAt: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        repository: GITHUB_REPO,
        branch: GITHUB_BRANCH,
      },
      games: bingoGames
    };

    // 写入JSON文件
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf8');

    console.log(`\n✅ Successfully generated ${OUTPUT_FILE}`);
    console.log(`📊 Total bingo games: ${bingoGames.length}`);
    console.log(`📁 Total file size: ${formatFileSize(bingoGames.reduce((sum, game) => sum + game.fileSize, 0))}`);

    // 显示Git统计信息
    if (isGitRepo) {
      console.log(`🔄 Games with Git info: ${gamesWithGitInfo.length}/${bingoGames.length}`);
      if (newestGame) {
        console.log(`🆕 Most recently updated: ${newestGame.gameName} (${newestGame.lastModified})`);
      }
    }

    // 显示前5个文件作为示例
    if (bingoGames.length > 0) {
      console.log('\n📋 Sample games:');
      bingoGames.slice(0, 5).forEach((game, index) => {
        const timeInfo = game.createdAt ? ` | 创建: ${game.createdAt}` : '';
        console.log(`  ${index + 1}. ${game.gameName} (${game.fileSizeFormatted}${timeInfo})`);
      });

      if (bingoGames.length > 5) {
        console.log(`  ... and ${bingoGames.length - 5} more games`);
      }
    }

  } catch (error) {
    console.error('❌ Error generating bingo games list:', error.message);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  console.log('🚀 Generating bingo games list...');
  generateBingoGamesList();
}

module.exports = { generateBingoGamesList };