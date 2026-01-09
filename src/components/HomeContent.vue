<template>
  <div class="home-container">
    <div class="content-wrapper">
      <div class="home-grid">
        <div class="home-left">
          <h1 class="home-title">{{ t('home.title') }}</h1>
          <p class="home-subtitle">{{ t('home.subtitle') }}</p>
          <GradientButton to="/login">
            {{ t('home.createFirstChallenge') }}
          </GradientButton>
        </div>
        <div class="home-right">
          <img :src="homePagePicture" alt="ChallengeMe" class="home-page-image" />
        </div>
      </div>

      <!-- Benefits Section -->
      <div class="benefits-section">
        <h2 class="benefits-title">
          <v-icon color="primary" class="benefits-title-icon">mdi-star-circle</v-icon>
          {{ t('home.benefitsTitle') }}
        </h2>
        
        <div class="benefits-list">
          <!-- Block 1 - Odd (image left) -->
          <div class="benefit-block benefit-block-odd">
            <div class="benefit-image-wrapper">
              <img :src="benefitImage1" alt="" class="benefit-image" />
            </div>
            <div class="benefit-content">
              <h3 class="benefit-title">{{ t('home.benefits.block1.title') }}</h3>
              <p class="benefit-description">{{ t('home.benefits.block1.description') }}</p>
            </div>
          </div>

          <!-- Block 2 - Even (image right) -->
          <div class="benefit-block benefit-block-even">
            <div class="benefit-image-wrapper">
              <img :src="benefitImage2" alt="" class="benefit-image" />
            </div>
            <div class="benefit-content">
              <h3 class="benefit-title">{{ t('home.benefits.block2.title') }}</h3>
              <p class="benefit-description">{{ t('home.benefits.block2.description') }}</p>
            </div>
          </div>

          <!-- Block 3 - Odd (image left) -->
          <div class="benefit-block benefit-block-odd">
            <div class="benefit-image-wrapper">
              <img :src="benefitImage3" alt="" class="benefit-image" />
            </div>
            <div class="benefit-content">
              <h3 class="benefit-title">{{ t('home.benefits.block3.title') }}</h3>
              <p class="benefit-description">{{ t('home.benefits.block3.description') }}</p>
            </div>
          </div>

          <!-- Block 4 - Even (image right) -->
          <div class="benefit-block benefit-block-even">
            <div class="benefit-image-wrapper">
              <img :src="benefitImage4" alt="" class="benefit-image" />
            </div>
            <div class="benefit-content">
              <h3 class="benefit-title">{{ t('home.benefits.block4.title') }}</h3>
              <p class="benefit-description">{{ t('home.benefits.block4.description') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Demo Section -->
      <div class="demo-section">
        <div class="demo-image-wrapper">
          <img :src="demoImage" alt="Demo" class="demo-image" />
        </div>
      </div>

      <!-- Copyright Section -->
      <div class="copyright-section">
        <p class="copyright-text">{{ t('home.copyright', { year: new Date().getFullYear() }) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import homePagePicture from '../assets/Adobe Express - file.png'
import benefitImage1 from '../assets/01.png'
import benefitImage2 from '../assets/02.png'
import benefitImage3 from '../assets/03.png'
import benefitImage4 from '../assets/04.png'
import demoImage from '../assets/demo.png'
import GradientButton from './GradientButton.vue'

const { t } = useI18n()
</script>

<style scoped>
.home-container {
  min-height: auto;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0 0.75em;
  padding-top: 0.75em;
  box-sizing: border-box;
}

@media (min-width: 400px) {
  .home-container {
    padding: 0 1em;
    padding-top: 1em;
  }
}

@media (min-width: 600px) {
  .home-container {
    padding: 0 1.5em;
    padding-top: 1.5em;
  }
}

@media (min-width: 960px) {
  .home-container {
    padding: 0 24px;
    padding-top: 2em;
  }
}

@media (min-width: 1280px) {
  .home-container {
    padding: 0 48px;
    padding-top: 2.5em;
  }
}

.content-wrapper {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.home-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1em;
  align-items: center;
}

@media (min-width: 400px) {
  .home-grid {
    gap: 1.25em;
  }
}

@media (min-width: 600px) {
  .home-grid {
    gap: 2em;
  }
}

@media (min-width: 960px) {
  .home-grid {
    grid-template-columns: 1fr 1fr;
    gap: 2em;
  }
}

@media (min-width: 1280px) {
  .home-grid {
    gap: 3em;
  }
}

.home-left {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
  order: 2;
}

@media (min-width: 400px) {
  .home-left {
    gap: 1em;
  }
}

@media (min-width: 960px) {
  .home-left {
    order: 1;
  }
}

.home-title {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.87);
  margin: 0;
  word-wrap: break-word;
}

@media (min-width: 400px) {
  .home-title {
    font-size: 2rem;
  }
}

@media (min-width: 600px) {
  .home-title {
    font-size: 3rem;
  }
}

@media (min-width: 960px) {
  .home-title {
    font-size: 4rem;
  }
}

.home-subtitle {
  font-size: 0.9rem;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
  word-wrap: break-word;
}

@media (min-width: 400px) {
  .home-subtitle {
    font-size: 1rem;
  }
}

@media (min-width: 600px) {
  .home-subtitle {
    font-size: 1.25rem;
  }
}

.gradient-button {
  width: 100%;
  max-width: 100%;
  margin-top: 0.5em;
}

@media (min-width: 400px) {
  .gradient-button {
    max-width: 350px;
  }
}

@media (min-width: 600px) {
  .gradient-button {
    max-width: 400px;
    font-size: 0.95rem;
  }
}

.home-right {
  display: flex;
  align-items: center;
  justify-content: center;
  order: 1;
  margin-bottom: 1em;
}

@media (min-width: 960px) {
  .home-right {
    order: 2;
    margin-bottom: 0;
  }
}

.home-page-image {
  width: 100%;
  height: auto;
  max-width: 100%;
  object-fit: contain;
  border-radius: 12px;
}

@media (min-width: 400px) {
  .home-page-image {
    border-radius: 14px;
  }
}

@media (min-width: 960px) {
  .home-page-image {
    max-width: 120%;
    border-radius: 16px;
    transform: scale(1.2);
  }
}

/* Benefits Section */
.benefits-section {
  width: 100%;
  margin-top: 1.5em;
  padding: 1em 0;
}

@media (min-width: 400px) {
  .benefits-section {
    margin-top: 2em;
    padding: 1.5em 0;
  }
}

@media (min-width: 600px) {
  .benefits-section {
    margin-top: 2.5em;
    padding: 2em 0;
  }
}

@media (min-width: 960px) {
  .benefits-section {
    margin-top: 3em;
    padding: 2.5em 0;
  }
}

.benefits-title {
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
  color: rgba(0, 0, 0, 0.87);
  margin: 0 0 1em 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5em;
}

.benefits-title-icon {
  font-size: 1.25rem !important;
  margin-right: 0;
}

@media (min-width: 400px) {
  .benefits-title {
    font-size: 1.5rem;
    margin-bottom: 1.25em;
  }
  
  .benefits-title-icon {
    font-size: 1.5rem !important;
    margin-right: 0.5em;
  }
}

@media (min-width: 600px) {
  .benefits-title {
    font-size: 1.75rem;
    margin-bottom: 2em;
  }
  
  .benefits-title-icon {
    font-size: 1.75rem !important;
  }
}

@media (min-width: 960px) {
  .benefits-title {
    font-size: 2rem;
    margin-bottom: 2.5em;
  }
  
  .benefits-title-icon {
    font-size: 2rem !important;
  }
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 1.25em;
}

@media (min-width: 400px) {
  .benefits-list {
    gap: 1.5em;
  }
}

@media (min-width: 600px) {
  .benefits-list {
    gap: 2em;
  }
}

@media (min-width: 960px) {
  .benefits-list {
    gap: 2.5em;
  }
}

.benefit-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75em;
  width: 100%;
}

@media (min-width: 400px) {
  .benefit-block {
    gap: 1em;
  }
}

@media (min-width: 600px) {
  .benefit-block {
    gap: 1.25em;
  }
}

@media (min-width: 960px) {
  .benefit-block {
    flex-direction: row;
    align-items: center;
    gap: 2em;
  }

  .benefit-block-odd {
    flex-direction: row;
  }

  .benefit-block-even {
    flex-direction: row-reverse;
  }
}

.benefit-image-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 280px;
}

@media (min-width: 400px) {
  .benefit-image-wrapper {
    max-width: 320px;
  }
}

@media (min-width: 600px) {
  .benefit-image-wrapper {
    max-width: 400px;
  }
}

@media (min-width: 960px) {
  .benefit-image-wrapper {
    flex: 0 0 40%;
    max-width: 350px;
  }
}

.benefit-image {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: contain;
  border-radius: 10px;
}

@media (min-width: 400px) {
  .benefit-image {
    max-height: 230px;
    border-radius: 11px;
  }
}

@media (min-width: 600px) {
  .benefit-image {
    max-height: 280px;
    border-radius: 12px;
  }
}

@media (min-width: 960px) {
  .benefit-image {
    max-height: 300px;
  }
}

.benefit-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  text-align: center;
  width: 100%;
}

@media (min-width: 400px) {
  .benefit-content {
    gap: 0.75em;
  }
}

@media (min-width: 960px) {
  .benefit-content {
    flex: 0 0 50%;
    text-align: left;
  }
}

.benefit-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
  margin: 0;
  word-wrap: break-word;
}

@media (min-width: 400px) {
  .benefit-title {
    font-size: 1.25rem;
  }
}

@media (min-width: 600px) {
  .benefit-title {
    font-size: 1.5rem;
  }
}

@media (min-width: 960px) {
  .benefit-title {
    font-size: 1.75rem;
  }
}

.benefit-description {
  font-size: 0.85rem;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
  word-wrap: break-word;
}

@media (min-width: 400px) {
  .benefit-description {
    font-size: 0.9rem;
  }
}

@media (min-width: 600px) {
  .benefit-description {
    font-size: 1rem;
  }
}

@media (min-width: 960px) {
  .benefit-description {
    font-size: 1.05rem;
  }
}

/* Demo Section */
.demo-section {
  width: 100%;
  margin-top: 1.5em;
  padding: 0;
}

@media (min-width: 400px) {
  .demo-section {
    margin-top: 2em;
  }
}

@media (min-width: 600px) {
  .demo-section {
    margin-top: 2.5em;
  }
}

@media (min-width: 960px) {
  .demo-section {
    margin-top: 3em;
  }
}

.demo-image-wrapper {
  width: 100%;
  padding: 2px;
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%);
  border-radius: 12px;
  overflow: hidden;
}

@media (min-width: 400px) {
  .demo-image-wrapper {
    border-radius: 14px;
  }
}

@media (min-width: 600px) {
  .demo-image-wrapper {
    border-radius: 16px;
  }
}

.demo-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  border-radius: 10px;
}

@media (min-width: 400px) {
  .demo-image {
    border-radius: 12px;
  }
}

@media (min-width: 600px) {
  .demo-image {
    border-radius: 14px;
  }
}

/* Copyright Section */
.copyright-section {
  width: 100%;
  margin-top: 1.5em;
  padding: 1em 0.75em;
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%);
  border-radius: 12px;
  box-sizing: border-box;
}

@media (min-width: 400px) {
  .copyright-section {
    margin-top: 2em;
    padding: 1.5em 1em;
    border-radius: 14px;
  }
}

@media (min-width: 600px) {
  .copyright-section {
    margin-top: 2.5em;
    padding: 2em 1.5em;
    border-radius: 16px;
  }
}

@media (min-width: 960px) {
  .copyright-section {
    margin-top: 3em;
    padding: 2.5em 2em;
  }
}

.copyright-text {
  text-align: center;
  color: white;
  font-size: 0.8rem;
  margin: 0;
  font-weight: 500;
  word-wrap: break-word;
  padding: 0 0.5em;
}

@media (min-width: 400px) {
  .copyright-text {
    font-size: 0.85rem;
    padding: 0;
  }
}

@media (min-width: 600px) {
  .copyright-text {
    font-size: 0.9rem;
  }
}

@media (min-width: 960px) {
  .copyright-text {
    font-size: 1rem;
  }
}
</style>
