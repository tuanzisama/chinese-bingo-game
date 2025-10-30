import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface LazyImageOptions {
  rootMargin?: string
  threshold?: number
  placeholder?: string
}

export function useLazyImage(
  imageRef: Ref<HTMLImageElement | null>,
  src: string,
  options: LazyImageOptions = {}
) {
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const hasError = ref(false)
  
  const {
    rootMargin = '50px',
    threshold = 0.1,
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWKoOi9veS4rS4uLjwvdGV4dD48L3N2Zz4='
  } = options

  let observer: IntersectionObserver | null = null

  const loadImage = () => {
    if (!imageRef.value || isLoaded.value || isLoading.value) return

    isLoading.value = true
    hasError.value = false

    const img = new Image()
    
    img.onload = () => {
      if (imageRef.value) {
        imageRef.value.src = src
        isLoaded.value = true
        isLoading.value = false
      }
    }

    img.onerror = () => {
      hasError.value = true
      isLoading.value = false
      if (imageRef.value) {
        // 设置错误占位图
        imageRef.value.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1IiBzdHJva2U9IiNkZGQiIHN0cm9rZS13aWR0aD0iMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuWKoOi9veWksei0pTwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjYwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjYmJiIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7or7fngrnlh7rlpI3or5U8L3RleHQ+PC9zdmc+'
      }
    }

    img.src = src
  }

  const setupObserver = () => {
    if (!imageRef.value || !('IntersectionObserver' in window)) {
      // 如果不支持 IntersectionObserver，直接加载图片
      loadImage()
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage()
            observer?.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.observe(imageRef.value)
  }

  onMounted(() => {
    if (imageRef.value) {
      // 设置初始占位图
      imageRef.value.src = placeholder
      setupObserver()
    }
  })

  onUnmounted(() => {
    if (observer && imageRef.value) {
      observer.unobserve(imageRef.value)
      observer.disconnect()
    }
  })

  return {
    isLoaded,
    isLoading,
    hasError,
    loadImage
  }
}