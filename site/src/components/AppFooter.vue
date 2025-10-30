<template>
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
</template>

<script setup lang="ts">
// 这个组件不需要任何 props 或逻辑
</script>

<style lang="scss" scoped>
/* 页脚样式 */
.page-footer {
  margin-top: 64px;
  padding: 32px 20px;
  border-top: 1px solid #e0e0e0;
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

  strong {
    font-weight: 600;
  }
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