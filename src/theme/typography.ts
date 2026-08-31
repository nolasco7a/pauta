/**
 * Manrope es la fuente de marca (ver mockup del canvas de diseño).
 * Las familias se registran en App.tsx vía @expo-google-fonts/manrope.
 */
export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
};

export const type = {
  display: { fontFamily: fonts.extrabold, fontSize: 22, letterSpacing: -0.2 },
  title: { fontFamily: fonts.extrabold, fontSize: 16 },
  body: { fontFamily: fonts.semibold, fontSize: 14 },
  bodyRegular: { fontFamily: fonts.regular, fontSize: 14 },
  caption: { fontFamily: fonts.medium, fontSize: 12 },
  label: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' as const },
  script: { fontFamily: fonts.regular, fontSize: 19, lineHeight: 30 },
  prompterCurrent: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 28 },
  prompterFaded: { fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 22 },
};
