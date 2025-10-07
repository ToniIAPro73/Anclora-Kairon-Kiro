# Repository Guidelines

## Project Structure & Module Organization
- `src/landing` contiene la landing page (HTML/CSS ligeros + componentes especificos).
- `src/app` aloja la aplicacion principal y sus componentes; usa alias `@app` al importar.
- `src/shared` guarda utilidades, estilos del diseno Anclora y el set de pruebas reutilizables.
- `public` expone assets estaticos; `dist` se genera con cualquier comando `build` y no se edita a mano.
- Configuraciones clave: `vite*.config.js` para builds segmentadas, `tailwind.config.js` para tokens de diseno y `src/shared/test/setup.js` para mocks globales.

## Build, Test, and Development Commands
- `npm run dev` levanta ambas superficies en Vite; usar `dev:landing` o `dev:app` para sesiones enfocadas.
- `npm run build`, `build:landing` y `build:app` generan artefactos en `dist/` y deben ejecutarse antes de publicar.
- `npm run preview` valida la build localmente.
- `npm run lint`, `lint:fix` y `npm run format` mantienen ESLint + Prettier alineados con la configuracion del repositorio.
- `npm run test`, `test:watch` y `test:ui` cubren la suite Vitest; `npm run test:integration*` ejecuta los flujos criticos definidos bajo `src/shared/test`.

## Coding Style & Naming Conventions
- Prettier fuerza indentacion de 2 espacios, comillas simples, sin punto y coma y ancho maximo de 80 caracteres.
- ESLint (`eslint:recommended`) aplica `prefer-const`, prohibe `console` en produccion y admite globals de Vitest.
- Manten nombres descriptivos en minusculas con guiones para archivos (`user-experience-panel.js`) y `PascalCase` solo para componentes UI exportados.
- Usa importaciones con alias (`@shared/utils/...`) para evitar rutas relativas profundas.

## Testing Guidelines
- La suite unitaria se ubica en `src/shared/test`, con convencion `*.test.js`; los escenarios end-to-end simulados usan sufijo `.integration.test.js`.
- Asegura mocks consistentes reutilizando `authErrorSimulator` y helpers existentes en lugar de redefinirlos.
- Ejecuta `npm run test` antes de abrir un PR; agrega capturas o logs relevantes cuando introduzcas nuevas rutas felices o de error.

## Commit & Pull Request Guidelines
- Los commits recientes usan descripciones cortas en espanol y tiempo presente (por ejemplo, `mejora manejo de errores oauth`).
- Agrupa cambios relacionados y evita commits genericos como "updates".
- Incluye en el PR: resumen del impacto, comandos ejecutados, issues vinculados y capturas para cambios UI (usa recursos en `/public` si aplica).
- Verifica que no se generen artefactos en `dist/` ni modificaciones accidentales en `.env` antes de solicitar revision.
