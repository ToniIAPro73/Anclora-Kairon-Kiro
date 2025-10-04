# TaskFlow MVP

TaskFlow MVP es una aplicación de gestión de proyectos con landing page profesional y funcionalidades avanzadas de colaboración, siguiendo el sistema de diseño Anclora Kairon.

## 🏗️ Estructura del Proyecto

```
taskflow-mvp/
├── src/
│   ├── landing/                 # Landing page
│   │   ├── index.html
│   │   ├── main.js
│   │   ├── style.css
│   │   └── components/          # Componentes específicos del landing
│   ├── app/                     # Aplicación principal
│   │   ├── index.html
│   │   ├── main.js
│   │   ├── style.css
│   │   └── components/          # Componentes específicos de la app
│   └── shared/                  # Recursos compartidos
│       ├── components/          # Componentes reutilizables
│       ├── styles/              # Estilos compartidos
│       │   ├── base.css
│       │   └── anclora-design-system.css
│       ├── utils/               # Utilidades compartidas
│       └── test/                # Configuración de testing
├── public/                      # Assets estáticos
├── dist/                        # Build output
├── vite.config.js              # Configuración principal de Vite
├── vite.landing.config.js      # Configuración específica del landing
├── vite.app.config.js          # Configuración específica de la app
├── tailwind.config.js          # Configuración de TailwindCSS
└── package.json
```

## 🚀 Scripts Disponibles

### Desarrollo
- `npm run dev` - Servidor de desarrollo con ambas aplicaciones
- `npm run dev:landing` - Servidor solo para landing page (puerto 3001)
- `npm run dev:app` - Servidor solo para la aplicación (puerto 3002)

### Build
- `npm run build` - Build de producción para ambas aplicaciones
- `npm run build:landing` - Build solo del landing page
- `npm run build:app` - Build solo de la aplicación

### Testing
- `npm run test` - Ejecutar tests una vez
- `npm run test:watch` - Ejecutar tests en modo watch
- `npm run test:ui` - Interfaz visual para tests

### Calidad de Código
- `npm run lint` - Ejecutar ESLint
- `npm run lint:fix` - Corregir errores de ESLint automáticamente
- `npm run format` - Formatear código con Prettier

## 🎨 Sistema de Diseño Anclora Kairon

### Paleta de Colores
- **Azul Profundo**: `#23436B` - Color principal
- **Azul Claro**: `#2EAFC4` - Color de acento
- **Teal Secundario**: `#37B5A4` - Color de éxito
- **Ámbar Suave**: `#FFC979` - Color de advertencia
- **Gris Claro**: `#F6F7F9` - Fondos secundarios
- **Negro Azulado**: `#162032` - Texto principal
- **Blanco**: `#FFFFFF` - Fondos principales

### Tipografías
- **Libre Baskerville**: Títulos y encabezados (serif)
- **Inter**: Interfaz y texto general (sans-serif)
- **JetBrains Mono**: Código y elementos monoespaciados

### Componentes Disponibles
- **Botones**: 5 variantes (primary, secondary, outline, ghost, danger) en 3 tamaños
- **Cards**: 4 variantes con efectos glass morphism
- **Theme Toggle**: Cambio automático entre modo claro/oscuro
- **Language Selector**: Cambio entre español/inglés
- **Sistema de espaciado**: Grid de 8pt con utilidades CSS
- **Breakpoints responsive**: Mobile-first design

### Gradientes
- **Hero**: `linear-gradient(120deg, #23436B 0%, #2EAFC4 100%)`
- **Acción**: `linear-gradient(90deg, #2EAFC4 0%, #FFC979 100%)`
- **Sutil**: `linear-gradient(180deg, #F6F7F9 0%, #FFFFFF 100%)`
- **Glass**: `linear-gradient(135deg, rgba(46,175,196,0.1) 0%, rgba(55,181,164,0.05) 100%)`

Ver documentación completa en `src/shared/styles/README.md`

## 🛠️ Tecnologías

- **Frontend**: Vanilla JavaScript + React CDN
- **Styling**: TailwindCSS + CSS personalizado
- **Build**: Vite
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint + Prettier

## 📱 Responsive Design

El proyecto sigue un enfoque mobile-first con breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🌙 Modo Oscuro

Soporte automático para modo oscuro basado en preferencias del sistema, con posibilidad de toggle manual.

## 🌍 Internacionalización

Soporte para español (por defecto) e inglés, con persistencia de preferencias en localStorage.

## 🚀 Primeros Pasos

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar desarrollo**:
   ```bash
   npm run dev
   ```

3. **Ejecutar tests**:
   ```bash
   npm run test
   ```

4. **Build para producción**:
   ```bash
   npm run build
   ```

## 📋 Próximos Pasos

Este setup inicial proporciona la base para implementar:
- Landing page con hero section y características
- Dashboard de gestión de tareas mejorado
- Sistema de proyectos y colaboración
- Chat en tiempo real
- Asistente IA integrado
- Analytics y métricas de productividad