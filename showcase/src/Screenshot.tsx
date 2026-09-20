import { AbsoluteFill, Img, staticFile } from 'remotion';

// Mirrors src/theme/colors.ts (dark cinematic palette) so store assets match the app.
const colors = {
  bg: '#0C0C0E',
  bgElevated: '#17171B',
  textPrimary: '#F3F2EE',
  accent: '#E7A94C',
  border: '#28282E',
};

const Corner: React.FC<{ position: 'top-left' | 'bottom-right' }> = ({ position }) => {
  const isTopLeft = position === 'top-left';
  return (
    <div
      style={{
        position: 'absolute',
        width: 70,
        height: 70,
        ...(isTopLeft ? { top: 48, left: 48 } : { bottom: 48, right: 48 }),
        borderTop: isTopLeft ? `6px solid ${colors.accent}` : undefined,
        borderLeft: isTopLeft ? `6px solid ${colors.accent}` : undefined,
        borderBottom: !isTopLeft ? `6px solid ${colors.accent}` : undefined,
        borderRight: !isTopLeft ? `6px solid ${colors.accent}` : undefined,
        opacity: 0.85,
      }}
    />
  );
};

// Caption markup: wrap a word in **asterisks** to render it in the accent color.
const Caption: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} style={{ color: colors.accent }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
};

export const Screenshot: React.FC<{ image: string; caption: string }> = ({ image, caption }) => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${colors.bg} 0%, ${colors.bgElevated} 100%)`,
        alignItems: 'center',
        fontFamily: 'Helvetica, Arial, sans-serif',
        paddingTop: 60,
        paddingBottom: 46,
      }}
    >
      <Corner position="top-left" />
      <Corner position="bottom-right" />

      <Img src={staticFile('brand/icon.png')} style={{ height: 150, width: 150, borderRadius: 32 }} />

      <div
        style={{
          marginTop: 20,
          height: 140,
          width: 920,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: 58,
          fontWeight: 700,
          color: colors.textPrimary,
          lineHeight: 1.15,
          whiteSpace: 'pre-wrap',
        }}
      >
        <Caption text={caption} />
      </div>

      <div style={{ position: 'relative', marginTop: 26 }}>
        <div
          style={{
            position: 'absolute',
            inset: -90,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.accent} 0%, transparent 68%)`,
            opacity: 0.3,
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'relative',
            height: 1380,
            borderRadius: 48,
            overflow: 'hidden',
            border: `2px solid ${colors.border}`,
            boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 100px rgba(231,169,76,0.15)`,
          }}
        >
          <Img src={image} style={{ height: '100%', display: 'block' }} />
        </div>
      </div>

      <div
        style={{
          marginTop: 30,
          width: 240,
          height: 6,
          borderRadius: 3,
          background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
        }}
      />
    </AbsoluteFill>
  );
};
