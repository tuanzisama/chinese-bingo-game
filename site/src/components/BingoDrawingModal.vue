<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ game.gameName }} - 绘画模式</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>

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
          <button @click="clearCanvas" class="tool-btn clear-btn">清除画布</button>
          <button @click="toggleEraser" :class="['tool-btn', { active: isErasing }]">
            {{ isErasing ? '画笔模式' : '橡皮擦' }}
          </button>
        </div>
      </div>

      <div class="canvas-container">
        <canvas ref="canvasElement" :width="canvasWidth" :height="canvasHeight"></canvas>
      </div>

      <div class="modal-actions">
        <button @click="downloadCanvas" class="action-btn download-btn">
          📥 下载图片
        </button>
        <button @click="copyCanvas" class="action-btn copy-btn">
          📋 复制到剪贴板
        </button>
        <button @click="resetCanvas" class="action-btn reset-btn">
          🔄 重置画布
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick } from 'vue';
import { Canvas, PencilBrush, FabricImage, util } from 'fabric';
import { EraserBrush } from '@erase2d/fabric';
import type { BingoGame } from '../types';
import { useIsTransparentWorker } from '../composables/useIsTransparent';

interface Props {
  isVisible: boolean;
  game: BingoGame;
}

interface Emits {
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isTransparent = useIsTransparentWorker();
const canvasElement = ref<HTMLCanvasElement | null>(null);
const fabricCanvas = ref<Canvas | null>(null);

// 绘画工具状态
const brushColor = ref('#ff0000');
const brushWidth = ref(5);
const isErasing = ref(false);

// Canvas 尺寸
const canvasWidth = ref(800);
const canvasHeight = ref(600);

// 初始化 Fabric.js Canvas
const initCanvas = async () => {
  if (!canvasElement.value) return;

  fabricCanvas.value = new Canvas(canvasElement.value, {
    isDrawingMode: true,
    width: canvasWidth.value,
    height: canvasHeight.value,
    backgroundColor: 'white'
  });

  // 初始化画笔
  fabricCanvas.value.freeDrawingBrush = new PencilBrush(fabricCanvas.value as Canvas);

  // 设置初始画笔属性
  updateBrushColor();
  updateBrushWidth();

  // 加载背景图片
  await loadBackgroundImage();
};

// 加载背景图片
const loadBackgroundImage = async () => {
  if (!fabricCanvas.value) return;

  try {
    const img = await util.loadImage(props.game.githubUrl, { crossOrigin: 'anonymous' });
    const fabricImg = new FabricImage(img, {

    });

    // 计算图片缩放比例以适应画布
    const imgWidth = fabricImg.width || 1;
    const imgHeight = fabricImg.height || 1;
    const scaleX = canvasWidth.value / imgWidth;
    const scaleY = canvasHeight.value / imgHeight;
    const scale = Math.min(scaleX, scaleY);

    fabricImg.set({
      scaleX: scale,
      scaleY: scale,
      left: (canvasWidth.value - imgWidth * scale) / 2,
      top: (canvasHeight.value - imgHeight * scale) / 2,
      selectable: false,
      evented: false,
      erasable: false  // 防止背景图片被橡皮擦擦除
    });

    fabricCanvas.value.add(fabricImg);
    fabricCanvas.value.sendObjectToBack(fabricImg);
    fabricCanvas.value.renderAll();

    fabricCanvas.value.on('path:created', (e) => {
      console.info('path:created', e.path);
      if (!isErasing.value) {
        e.path.set({ erasable: true });
      }
    });
  } catch (error) {
    console.error('加载背景图片失败:', error);
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

  eraser.on('end', async (e) => {
    e.preventDefault();

    await eraser.commit(e.detail);

    const transparent = await Promise.all(
      e.detail.targets.map(
        async (target) => [target, await isTransparent(target)] as const
      )
    );

    if (fabricCanvas.value) {
      const fullyErased = transparent
        .filter(([, transparent]) => transparent)
        .map(([object]) => object);

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

// 清除画布（保留背景图片）
const clearCanvas = () => {
  if (!fabricCanvas.value) return;

  const objects = fabricCanvas.value.getObjects();
  const backgroundImg = objects[0]; // 假设背景图片是第一个对象

  fabricCanvas.value.clear();
  if (backgroundImg && backgroundImg.type === 'image') {
    fabricCanvas.value.add(backgroundImg);
  }
  fabricCanvas.value.renderAll();
};

// 重置画布
const resetCanvas = async () => {
  if (!fabricCanvas.value) return;
  fabricCanvas.value.clear();
  fabricCanvas.value.backgroundColor = 'white';
  await loadBackgroundImage();
};

// 下载画布内容
const downloadCanvas = () => {
  if (!fabricCanvas.value) return;

  const dataURL = fabricCanvas.value.toDataURL({
    format: 'png',
    quality: 1,
    multiplier: 2
  });

  const link = document.createElement('a');
  link.download = `${props.game.gameName}_绘画.png`;
  link.href = dataURL;
  link.click();
};

// 复制到剪贴板
const copyCanvas = async () => {
  if (!fabricCanvas.value) return;

  try {
    const dataURL = fabricCanvas.value.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    });

    // 将 dataURL 转换为 Blob
    const response = await fetch(dataURL);
    const blob = await response.blob();

    // 复制到剪贴板
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);

    alert('画布内容已复制到剪贴板！');
  } catch (error) {
    console.error('复制失败:', error);
    alert('复制失败，请尝试下载功能');
  }
};

// 关闭弹窗
const closeModal = () => {
  emit('close');
};

// 监听弹窗显示状态
watch(() => props.isVisible, async (newVal) => {
  if (newVal) {
    await nextTick();
    initCanvas();
  } else {
    // 清理 Canvas
    if (fabricCanvas.value) {
      fabricCanvas.value.dispose();
      fabricCanvas.value = null;
    }
  }
});

// 组件卸载时清理
onUnmounted(() => {
  if (fabricCanvas.value) {
    fabricCanvas.value.dispose();
  }
});
</script>

<style scoped>
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
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
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
}

.close-btn:hover {
  background: #f0f0f0;
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
}

.tool-group label {
  font-size: 14px;
  color: #555;
  white-space: nowrap;
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
}

.tool-btn:hover {
  background: #f0f0f0;
}

.tool-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.clear-btn:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.canvas-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  background: #f8f9fa;
}

.canvas-container canvas {
  border: 2px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  justify-content: center;
  border-top: 1px solid #eee;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.download-btn {
  background: #28a745;
  color: white;
}

.download-btn:hover {
  background: #218838;
}

.copy-btn {
  background: #17a2b8;
  color: white;
}

.copy-btn:hover {
  background: #138496;
}

.reset-btn {
  background: #6c757d;
  color: white;
}

.reset-btn:hover {
  background: #5a6268;
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 95vw;
    max-height: 95vh;
  }

  .drawing-tools {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .tool-group {
    justify-content: space-between;
  }

  .canvas-container {
    padding: 10px;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
