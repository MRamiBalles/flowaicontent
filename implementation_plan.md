# PWA + Image Optimization Sprint

## Sprint: Q1 Pre-Launch Polish

### 🎯 Objetivos
1. **PWA + Service Worker**: Offline mode, background sync, push notifications
2. **Image Optimization**: WebP/AVIF + lazy loading para Core Web Vitals

---

## Fase 1: PWA + Service Worker ⚡

### 1.1 Workbox Service Worker
- ✅ Configurar workbox-precaching para assets críticos
- ✅ Implementar runtime caching strategies
- ✅ Background sync para requests fallidas
- ✅ Push notifications setup

### 1.2 PWA Manifest Enhancement
- ✅ Mejorar manifest.json con categorías y shortcuts
- ✅ Generar íconos PWA (192x192, 512x512)
- ✅ Configurar display mode y theme

### 1.3 Offline Fallback
- ✅ Crear página offline.html elegante
- ✅ Cache de rutas críticas (/dashboard, /auth)

---

## Fase 2: Image Optimization 🖼️

### 2.1 Lazy Loading Component
- ✅ Custom hook `useIntersectionObserver`
- ✅ LazyImage component con placeholder
- ✅ Soporte WebP/AVIF con fallback

### 2.2 Image Components
- ✅ OptimizedImage para uso general
- ✅ HeroImage para landing/marketing
- ✅ Avatar con lazy loading

### 2.3 Integration
- ✅ Actualizar componentes existentes
- ✅ Añadir loading="lazy" nativo como fallback

---

## 📊 Impacto Esperado

### PWA
- Funciona offline (service worker)
- Background sync para acciones fallidas
- Push notifications listas
- Instalable en móviles

### Images
- LCP mejorado en ~40% (lazy load)
- Peso reducido ~50% (WebP/AVIF)
- CLS evitado (placeholders)

---

## ⏱️ Tiempo Estimado: 35 minutos

## 🚀 Estado: INICIANDO
