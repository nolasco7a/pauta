# Showcase

Genera las imágenes de Play Store (1080×1920) a partir de las capturas de la app, con el
título y el estilo de marca superpuestos.

## Uso

```bash
cd showcase
npm install
npm run render          # renderiza public/android/* → out/android/*.png
```

## Agregar screenshots de iOS (futuro)

1. Poné las capturas en `public/ios/` con los mismos nombres de archivo que las de
   `public/android/` (ver `src/screens.ts`).
2. Corré `PLATFORM=ios npm run render`.

No hace falta tocar código: `src/Root.tsx` arma las composiciones a partir de
`PLATFORM` + `src/screens.ts`.

## Editar textos o agregar/quitar pantallas

Editá el array en `src/screens.ts` (id, nombre de archivo, caption).
