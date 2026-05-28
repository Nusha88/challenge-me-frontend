import { ref, onMounted, onUnmounted, watch, unref } from 'vue'

export function useInfiniteScroll({
  enabled,
  loading,
  loadingMore,
  onLoadMore,
  rootMargin = '400px'
}) {
  const loadMoreTrigger = ref(null)
  let observer = null

  function observeTrigger() {
    if (!observer) return

    observer.disconnect()

    if (loadMoreTrigger.value) {
      observer.observe(loadMoreTrigger.value)
    }
  }

  onMounted(() => {
    observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          !unref(loading) &&
          !unref(loadingMore) &&
          unref(enabled)
        ) {
          onLoadMore()
        }
      },
      { rootMargin }
    )

    watch(loadMoreTrigger, observeTrigger, { flush: 'post' })
    observeTrigger()
  })

  onUnmounted(() => {
    observer?.disconnect()
    observer = null
  })

  return { loadMoreTrigger }
}
