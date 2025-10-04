# Anclora Kairon Design System

Sistema de diseño completo para Anclora Kairon MVP siguiendo los principios del ecosistema Anclora.

## 🎨 Paleta de Colores

### Colores Base
- **Azul Profundo**: `#23436B` - Color principal para títulos y elementos importantes
- **Azul Claro**: `#2EAFC4` - Color de acento y enlaces
- **Teal Secundario**: `#37B5A4` - Color de éxito y elementos positivos
- **Ámbar Suave**: `#FFC979` - Color de advertencia y destacados
- **Gris Claro**: `#F6F7F9` - Fondos secundarios
- **Negro Azulado**: `#162032` - Texto principal
- **Blanco**: `#FFFFFF` - Fondos principales

### Colores Semánticos
- **Success**: `#37B5A4`
- **Warning**: `#FFC979`
- **Error**: `#E74C3C`
- **Info**: `#2EAFC4`

## 🎭 Gradientes

- **Hero**: `linear-gradient(120deg, #23436B 0%, #2EAFC4 100%)`
- **Action**: `linear-gradient(90deg, #2EAFC4 0%, #FFC979 100%)`
- **Subtle**: `linear-gradient(180deg, #F6F7F9 0%, #FFFFFF 100%)`
- **Card**: `linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(246,247,249,0.8) 100%)`
- **Glass**: `linear-gradient(135deg, rgba(46,175,196,0.1) 0%, rgba(55,181,164,0.05) 100%)`

## 📝 Tipografía

### Fuentes
- **Libre Baskerville**: Títulos y encabezados (serif)
- **Inter**: Interfaz y texto general (sans-serif)
- **JetBrains Mono**: Código y elementos monoespaciados

### Escala Tipográfica
- **Display**: 72px (4.5rem) - Títulos principales
- **H1**: 48px (3rem) - Encabezados principales
- **H2**: 36px (2.25rem) - Encabezados secundarios
- **H3**: 30px (1.875rem) - Encabezados terciarios
- **Body Large**: 18px (1.125rem) - Texto destacado
- **Body**: 16px (1rem) - Texto base
- **Body Small**: 14px (0.875rem) - Texto secundario
- **Caption**: 12px (0.75rem) - Etiquetas y metadatos

### Clases de Tipografía
```css
.text-display      /* Títulos principales */
.text-h1           /* Encabezados H1 */
.text-h2           /* Encabezados H2 */
.text-h3           /* Encabezados H3 */
.text-body-xl      /* Texto grande */
.text-body-lg      /* Texto destacado */
.text-body         /* Texto base */
.text-body-sm      /* Texto pequeño */
.text-caption      /* Etiquetas */
.text-button       /* Texto de botones */
.text-code         /* Código */
```

## 🧩 Componentes

### Botones
```html
<!-- Botón primario -->
<button class="btn btn-primary btn-md">Botón Primario</button>

<!-- Botón secundario -->
<button class="btn btn-secondary btn-md">Botón Secundario</button>

<!-- Botón outline -->
<button class="btn btn-outline btn-md">Botón Outline</button>

<!-- Botón ghost -->
<button class="btn btn-ghost btn-md">Botón Ghost</button>
```

#### Tamaños
- `.btn-sm` - Botón pequeño (32px altura)
- `.btn-md` - Botón mediano (40px altura)
- `.btn-lg` - Botón grande (48px altura)

### Cards
```html
<!-- Card básica -->
<div class="card">
  <div class="card-header">
    <h3 class="text-h4">Título</h3>
  </div>
  <div class="card-body">
    <p class="text-body">Contenido de la card</p>
  </div>
  <div class="card-footer">
    Footer content
  </div>
</div>

<!-- Card con glass morphism -->
<div class="glass-card p-xl">
  <h3 class="text-h4">Glass Card</h3>
  <p class="text-body">Contenido con efecto glass</p>
</div>
```

#### Variantes
- `.card` - Card básica
- `.card-elevated` - Card con sombra elevada
- `.card-flat` - Card sin sombra
- `.card-interactive` - Card clickeable
- `.glass-card` - Card con efecto glass morphism

### Glass Morphism
```html
<!-- Glass sutil -->
<div class="glass-subtle p-lg">
  Contenido con glass sutil
</div>

<!-- Glass fuerte -->
<div class="glass-strong p-lg">
  Contenido con glass fuerte
</div>
```

## 📐 Sistema de Espaciado (8pt Grid)

```css
--space-xs: 4px     /* 0.25rem */
--space-sm: 8px     /* 0.5rem */
--space-md: 16px    /* 1rem */
--space-lg: 24px    /* 1.5rem */
--space-xl: 32px    /* 2rem */
--space-2xl: 48px   /* 3rem */
--space-3xl: 64px   /* 4rem */
--space-4xl: 96px   /* 6rem */
```

### Clases de Utilidad
```css
.p-xs, .p-sm, .p-md, .p-lg, .p-xl, .p-2xl  /* Padding */
.m-xs, .m-sm, .m-md, .m-lg, .m-xl, .m-2xl  /* Margin */
```

## 🔄 Border Radius

```css
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 20px
--radius-2xl: 24px
--radius-full: 9999px
```

### Clases de Utilidad
```css
.rounded-sm, .rounded-md, .rounded-lg, .rounded-xl, .rounded-2xl, .rounded-full
```

## 🌑 Sombras

```css
--shadow-sm: 0 2px 8px rgba(22, 32, 50, 0.08)
--shadow-md: 0 4px 20px rgba(22, 32, 50, 0.12)
--shadow-lg: 0 8px 32px rgba(22, 32, 50, 0.16)
--shadow-xl: 0 12px 48px rgba(22, 32, 50, 0.20)
--shadow-glass: 0 8px 32px rgba(46, 175, 196, 0.15)
```

### Clases de Utilidad
```css
.shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-glass
```

## 📱 Breakpoints Responsive (Mobile-First)

- **Small**: 576px+ (landscape phones)
- **Medium**: 768px+ (tablets)
- **Large**: 992px+ (desktops)
- **Extra Large**: 1200px+ (large desktops)

## 🌙 Modo Oscuro

El sistema soporta modo oscuro automático basado en preferencias del sistema y manual con la clase `.dark`.

### Variables de Modo Oscuro
```css
--dark-bg-primary: #162032
--dark-bg-secondary: #202837
--dark-text-primary: #F6F7F9
--dark-text-secondary: #2EAFC4
```

## ♿ Accesibilidad

- Focus rings con `box-shadow` para navegación por teclado
- Soporte para `prefers-reduced-motion`
- Soporte para `prefers-contrast: high`
- Colores con contraste WCAG AA compliant

## 🎬 Animaciones

```css
.animate-fade-in     /* Fade in suave */
.animate-slide-up    /* Deslizar hacia arriba */
.animate-scale-in    /* Escalar hacia adentro */
```

### Transiciones
```css
--transition-fast: 150ms ease-in-out
--transition-normal: 250ms ease-in-out
--transition-slow: 350ms ease-in-out
```

## 🚀 Uso

### Importar el Sistema
```css
@import './anclora-design-system.css';
```

### Usar Componentes JavaScript
```javascript
import { Button, Card, ThemeToggle } from '@shared/components'

// Crear botón
const button = Button.create({
  text: 'Mi Botón',
  variant: 'primary',
  onClick: () => console.log('Clicked!')
})

// Crear card
const card = Card.create({
  title: 'Mi Card',
  content: 'Contenido de la card',
  variant: 'glass'
})
```

### Usar Utilidades de Tema
```javascript
import theme from '@shared/utils/theme'

// Inicializar tema
theme.initializeTheme()

// Cambiar tema
theme.toggleTheme()
```

## 📚 Ejemplos

Ver los archivos de ejemplo en:
- `src/landing/index.html` - Implementación en landing page
- `src/shared/components/` - Componentes reutilizables
- `src/shared/components/*.test.js` - Tests de componentes