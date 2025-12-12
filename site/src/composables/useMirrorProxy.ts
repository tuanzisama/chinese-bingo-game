import { ref, computed } from "vue";

// 镜像配置接口
export interface MirrorConfig {
  id: string;
  name: string;
  pattern: string;
}

// 可用的镜像配置
export const MIRROR_CONFIGS: MirrorConfig[] = [
  {
    id: "official",
    name: "Official",
    pattern: "{path}",
  },
  {
    id: "cloudflare-ipv4",
    name: "Cloudflare (IPv4)",
    pattern: "https://gh-proxy.org/{path}",
  },
  {
    id: "cloudflare-ipv6",
    name: "Cloudflare (IPv6)",
    pattern: "https://v6.gh-proxy.org/{path}",
  },
  {
    id: "hongkong-cdn",
    name: "香港 CDN",
    pattern: "https://hk.gh-proxy.org/{path}",
  },
  {
    id: "fastly-cdn",
    name: "Fastly CDN",
    pattern: "https://cdn.gh-proxy.org/{path}",
  },
  {
    id: "edgeone-global",
    name: "EdgeOne 全球",
    pattern: "https://edgeone.gh-proxy.org/{path}",
  },
];

// 本地存储键名
const STORAGE_KEY = "bingo-mirror-selection";

// 从本地存储读取选择的镜像，默认为第一个
const getStoredMirrorId = (): string => {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    if (id !== null) {
      const index = MIRROR_CONFIGS.findIndex((config) => config.id === id);
      if (index >= 0 && index < MIRROR_CONFIGS.length) {
        return id;
      }
    }
  } catch (error) {
    console.warn("Failed to read mirror selection from localStorage:", error);
  }
  return MIRROR_CONFIGS[0]!.id; // 默认使用第一个镜像
};

// 当前选择的镜像索引
const selectedMirrorId = ref(getStoredMirrorId());

// 当前选择的镜像配置
const selectedMirror = computed(() => MIRROR_CONFIGS.find((config) => config.id === selectedMirrorId.value));

// 设置镜像
const setMirror = (id: string) => {
  const index = MIRROR_CONFIGS.findIndex((config) => config.id === id);
  if (index >= 0 && index < MIRROR_CONFIGS.length) {
    selectedMirrorId.value = id;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (error) {
      console.warn("Failed to save mirror selection to localStorage:", error);
    }
  }
};

// 将原始URL转换为使用镜像的URL
const transformUrl = (originalUrl: string): string => {
  const mirror = selectedMirror.value;

  if (!mirror) {
    return originalUrl;
  }

  // 如果是Official镜像，直接返回原始URL
  if (mirror.pattern === "{path}") {
    return originalUrl;
  }

  // 替换pattern中的{path}为原始URL
  return mirror.pattern.replace("{path}", originalUrl);
};

// 专门用于处理GitHub Raw URL的转换
const transformGitHubRawUrl = (githubRawUrl: string): string => {
  return transformUrl(githubRawUrl);
};

export function useMirrorProxy() {
  return {
    MIRROR_CONFIGS,
    selectedMirrorId,
    selectedMirror,
    setMirror,
    transformUrl,
    transformGitHubRawUrl,
  };
}
