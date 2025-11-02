<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ game.gameName }} - 绘画模式</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <div class="drawing-tools">
          <div class="tool-group">
            <label>画笔颜色:</label>
            <input type="color" v-model="brushColor" @change="updateBrushColor" class="color-picker" />
          </div>

          <div class="tool-group">
            <label>画笔粗细:</label>
            <input type="range" min="1" max="20" v-model="brushWidth" @input="updateBrushWidth" class="width-slider" />
            <span class="width-display">{{ brushWidth }}px</span>
          </div>

          <div class="tool-group">
            <button @click="resetCanvas" class="tool-btn clear-btn">清除画布</button>
            <button @click="toggleEraser" :class="['tool-btn', { active: isErasing }]">
              {{ isErasing ? "画笔模式" : "橡皮擦" }}
            </button>
          </div>
        </div>

        <div class="canvas-container">
          <canvas ref="canvasElement" :width="canvasWidth" :height="canvasHeight"></canvas>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="downloadCanvas" class="action-btn download-btn">📥 下载图片</button>
        <button @click="copyCanvas" class="action-btn copy-btn">📋 复制到剪贴板</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, shallowRef, onMounted, reactive } from "vue";
import { Canvas, PencilBrush, FabricImage, util, FabricText } from "fabric";
import { EraserBrush } from "@erase2d/fabric";
import type { BingoGame } from "../types";
import { useIsTransparentWorker } from "../composables/useIsTransparent";
import { useUrlParams } from "../composables/useUrlParams";

interface Props {
  isVisible: boolean;
  game: BingoGame;
}

interface Emits {
  (e: "close"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isTransparent = useIsTransparentWorker();
const { clearGameParam } = useUrlParams();
const canvasElement = ref<HTMLCanvasElement | null>(null);
const fabricCanvas = ref<Canvas | null>(null);

// 绘画工具状态
const brushColor = ref("#ff0000");
const brushWidth = ref(5);
const isErasing = ref(false);

const isSmallScreen = ref(false);

// Canvas 尺寸 - 响应式设计
const canvasWidth = ref(800);
const canvasHeight = ref(600);
const imageEl = shallowRef<HTMLImageElement | null>(null);

const canvasPadding = reactive({ top: 20, left: 20, bottom: 20, right: 20 });
const watermarkHeight = ref(40);

// 计算响应式画布尺寸，基于图片实际尺寸
const calculateCanvasSize = (imgWidth: number, imgHeight: number) => {
  // 设置窗口尺寸限制
  const isMobile = window.innerWidth <= 768;

  const maxWidthRatio = isMobile ? 0.9 : 0.8;
  const maxHeightRatio = isMobile ? 0.6 : 0.7;

  const maxWidth = window.innerWidth * maxWidthRatio;
  const maxHeight = window.innerHeight * maxHeightRatio;

  // 计算图片的宽高比
  const aspectRatio = imgWidth / imgHeight;

  let newWidth = imgWidth;
  let newHeight = imgHeight;

  // 如果图片尺寸超过窗口限制，按比例缩放
  if (newWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = newWidth / aspectRatio;
  }

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }

  canvasWidth.value = Math.floor(newWidth) + canvasPadding.left;
  canvasHeight.value = Math.floor(newHeight) + watermarkHeight.value + canvasPadding.top;
};

// 初始化 Fabric.js Canvas
const initCanvas = async () => {
  if (!canvasElement.value) return;

  if (!imageEl.value) {
    imageEl.value = await loadImage();
  }

  // 基于图片实际尺寸计算画布尺寸
  const imgWidth = imageEl.value.naturalWidth || imageEl.value.width;
  const imgHeight = imageEl.value.naturalHeight || imageEl.value.height;

  calculateCanvasSize(imgWidth, imgHeight);

  fabricCanvas.value = new Canvas(canvasElement.value, {
    isDrawingMode: true,
    width: canvasWidth.value,
    height: canvasHeight.value,
    backgroundColor: "white",
    enableRetinaScaling: true,
  });

  // 初始化画笔
  fabricCanvas.value.freeDrawingBrush = new PencilBrush(fabricCanvas.value as Canvas);

  // 设置初始画笔属性
  updateBrushColor();
  updateBrushWidth();

  // 加载背景图片
  await loadBackgroundImage(imageEl.value!);
};

const loadImage = async () => {
  return util.loadImage(props.game.githubUrl, { crossOrigin: "anonymous" });
};

// 加载背景图片
const loadBackgroundImage = async (imgEl: HTMLImageElement) => {
  if (!fabricCanvas.value) return;

  try {
    const fabricImg = new FabricImage(imgEl, {
      imageSmoothing: true,
    });

    // 由于画布尺寸已经基于图片尺寸计算，直接缩放图片填满画布
    const imgWidth = fabricImg.width || 1;
    const imgHeight = fabricImg.height || 1;
    const scaleX = (canvasWidth.value - canvasPadding.left - canvasPadding.right) / imgWidth;
    const scaleY = (canvasHeight.value - watermarkHeight.value - canvasPadding.top) / imgHeight;

    fabricImg.set({
      scaleX: scaleX,
      scaleY: scaleY,
      left: canvasPadding.left,
      top: canvasPadding.top,
      selectable: false,
      evented: false,
      erasable: false, // 防止背景图片被橡皮擦擦除
    });

    fabricCanvas.value.add(fabricImg);
    fabricCanvas.value.sendObjectToBack(fabricImg);

    const textConfig = {
      fontSize: 14,
      fontFamily: "Noto Sans SC, Barlow",
    };

    const text1 = `${truncateString(props.game.gameName, 18)} #中文互联网的宾果游戏`;
    const text2 = `👉 ${location.origin}`;

    const fabricText = new FabricText(text1, { ...textConfig, fill: "#757575" });
    const fabricText2 = new FabricText(text2, { ...textConfig, fill: "#BDBDBD" });

    fabricText.top = canvasHeight.value - watermarkHeight.value + fabricText.height * 0.6;
    fabricText.left = canvasPadding.left;

    if (isSmallScreen.value) {
      fabricText2.left = canvasPadding.left;
      fabricText2.top = fabricText.top + fabricText.height + 5; // 5 is the spacing between two lines
    } else {
      fabricText2.top = canvasHeight.value - watermarkHeight.value + fabricText2.height * 0.6;
      fabricText2.left = canvasWidth.value - canvasPadding.right - fabricText2.width;
    }

    fabricCanvas.value.add(fabricText);
    fabricCanvas.value.add(fabricText2);

    fabricCanvas.value.sendObjectToBack(fabricText);
    fabricCanvas.value.sendObjectToBack(fabricText2);
    fabricCanvas.value.requestRenderAll();

    fabricCanvas.value.on("path:created", (e) => {
      if (!isErasing.value) {
        e.path.set({ erasable: true });
      }
    });
  } catch (error) {
    console.error("加载背景图片失败:", error);
  }
};

// 更新画笔颜色
const updateBrushColor = () => {
  if (!fabricCanvas.value || !fabricCanvas.value.freeDrawingBrush) return;

  fabricCanvas.value.freeDrawingBrush.color = brushColor.value;
  isErasing.value = false;
};

// 更新画笔粗细
const updateBrushWidth = () => {
  if (!fabricCanvas.value || !fabricCanvas.value.freeDrawingBrush) return;

  fabricCanvas.value.freeDrawingBrush.width = parseInt(brushWidth.value.toString());
};

// 设置画笔模式
const setPencilMode = () => {
  if (!fabricCanvas.value) return;

  isErasing.value = false;
  fabricCanvas.value.freeDrawingBrush = new PencilBrush(fabricCanvas.value as Canvas);

  updateBrushColor();
  updateBrushWidth();
};

// 设置橡皮擦模式（使用真正的橡皮擦）
const setEraserMode = () => {
  if (!fabricCanvas.value) return;

  isErasing.value = true;
  // 使用 EraserBrush 实现真正的橡皮擦功能

  const eraser = new EraserBrush(fabricCanvas.value as Canvas);
  fabricCanvas.value.freeDrawingBrush = eraser;
  fabricCanvas.value.freeDrawingBrush.width = parseInt(brushWidth.value.toString());

  eraser.on("end", async (e) => {
    e.preventDefault();

    await eraser.commit(e.detail);

    const transparent = await Promise.all(e.detail.targets.map(async (target) => [target, await isTransparent(target)] as const));

    if (fabricCanvas.value) {
      const fullyErased = transparent.filter(([, transparent]) => transparent).map(([object]) => object);

      fullyErased.forEach((object) => (object.parent || fabricCanvas.value)?.remove(object));
      fabricCanvas.value.requestRenderAll();
    }
  });
};

// 切换橡皮擦模式
const toggleEraser = () => {
  if (!fabricCanvas.value) return;

  if (isErasing.value) {
    setPencilMode();
  } else {
    setEraserMode();
  }
};
// 重置画布
const resetCanvas = async () => {
  if (!fabricCanvas.value) return;
  fabricCanvas.value.clear();
  fabricCanvas.value.backgroundColor = "white";
  await loadBackgroundImage(imageEl.value!);
};

// 下载画布内容
const downloadCanvas = () => {
  if (!fabricCanvas.value) return;

  const dataURL = fabricCanvas.value.toDataURL({
    format: "png",
    quality: 1,
    multiplier: 2,
  });

  const link = document.createElement("a");
  link.download = `${props.game.gameName}_绘画.png`;
  link.href = dataURL;
  link.click();
};

// 复制到剪贴板
const copyCanvas = async () => {
  if (!fabricCanvas.value) return;

  try {
    const dataURL = fabricCanvas.value.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });

    // 将 dataURL 转换为 Blob
    const response = await fetch(dataURL);
    const blob = await response.blob();

    // 复制到剪贴板
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);

    alert("画布内容已复制到剪贴板！");
  } catch (error) {
    console.error("复制失败:", error);
    alert("复制失败，请尝试下载功能");
  }
};

const truncateString = (str: string, maxLength: number) => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
};

// 关闭弹窗
const closeModal = () => {
  // 清除URL参数
  clearGameParam();
  emit("close");
};

// 监听浏览器前进/后退事件
const handlePopState = () => {
  // 如果URL中没有game参数，说明用户点击了后退，应该关闭弹窗
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.get('game')) {
    emit("close");
  }
};

onMounted(() => {
  isSmallScreen.value = window.innerWidth <= 768 || window.innerHeight <= 768;
  canvasPadding.bottom = isSmallScreen.value ? 50 : 20;
  watermarkHeight.value = isSmallScreen.value ? 60 : 40;
  initCanvas();
  
  // 监听浏览器前进/后退事件
  window.addEventListener('popstate', handlePopState);
});

// 组件卸载时清理
onUnmounted(() => {
  if (fabricCanvas.value) {
    fabricCanvas.value.dispose();
    fabricCanvas.value = null;
  }
  
  // 清理事件监听器
  window.removeEventListener('popstate', handlePopState);
});
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;

  h3 {
    margin: 0;
    color: #333;
    font-size: 18px;
  }
}

.modal-body {
  flex: 1;
  position: relative;
  height: 0;
  overflow: auto;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f0f0f0;
  }
}

.drawing-tools {
  display: flex;
  gap: 20px;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
  align-items: center;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 8px;

  label {
    font-size: 14px;
    color: #555;
    white-space: nowrap;
  }
}

.color-picker {
  width: 40px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.width-slider {
  width: 100px;
}

.width-display {
  font-size: 12px;
  color: #666;
  min-width: 35px;
}

.tool-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f0f0;
  }

  &.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }
}

.clear-btn {
  &:hover {
    background: #dc3545;
    color: white;
    border-color: #dc3545;
  }
}

.canvas-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  background: #f8f9fa;
  overflow: hidden;

  canvas {
    border: 2px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    max-width: 100%;
    height: auto;
  }
}

.modal-actions {
  display: flex;
  gap: 6px;
  padding: 10px 20px;
  justify-content: center;
  flex-wrap: wrap;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}

.action-btn {
  padding: 5px 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.download-btn {
  background: #28a745;
  color: white;

  &:hover {
    background: #218838;
  }
}

.copy-btn {
  background: #17a2b8;
  color: white;

  &:hover {
    background: #138496;
  }
}

.reset-btn {
  background: #6c757d;
  color: white;

  &:hover {
    background: #5a6268;
  }
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 95vw;
    max-height: 95vh;
  }

  .drawing-tools {
    flex-direction: column;
    align-items: stretch;
    gap: 5px;
    padding: 5px 20px;
  }

  .tool-group {
    justify-content: space-between;
  }

  .canvas-container {
    padding: 10px;
  }
}
</style>
