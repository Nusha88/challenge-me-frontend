<template>
  <div class="hero-progress-light today-progress-skeleton" aria-hidden="true">
    <div class="progress-header">
      <span class="skeleton-pill skeleton-pill--wide" />
      <span class="skeleton-pill skeleton-pill--narrow" />
    </div>
    <div class="progress-track-soft skeleton-track">
      <span class="skeleton-bar" />
    </div>
  </div>
</template>

<style scoped>
.hero-progress-light {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  margin-bottom: 3em;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skeleton-pill {
  display: block;
  height: 1.2rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  position: relative;
  overflow: hidden;
}

.skeleton-pill--wide {
  width: 140px;
}

.skeleton-pill--narrow {
  width: 48px;
}

.progress-track-soft.skeleton-track {
  width: 100%;
  height: 10px;
  background: rgba(241, 243, 245, 0.12);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.skeleton-bar {
  display: block;
  width: 35%;
  height: 100%;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.08);
  position: relative;
  overflow: hidden;
}

.skeleton-pill::after,
.skeleton-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(79, 209, 197, 0.12),
    transparent
  );
  animation: today-progress-shimmer 1.4s ease-in-out infinite;
}

@keyframes today-progress-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (max-width: 959px) {
  .hero-progress-light {
    margin-bottom: 1.5em;
  }

  .skeleton-pill--wide {
    width: 110px;
  }
}
</style>
