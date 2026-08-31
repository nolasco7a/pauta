import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  deleteScript as dbDeleteScript,
  getAllScripts,
  upsertScript,
  type ScriptEntry,
  type VideoRef,
} from './db';

export type { ScriptEntry, VideoRef };

type ScriptContextValue = {
  title: string;
  setTitle: (text: string) => void;
  script: string;
  setScript: (text: string) => void;
  speed: number; // 0..1 -> se mapea a velocidad real de scroll
  setSpeed: (v: number) => void;
  fontSize: 'S' | 'M' | 'L';
  setFontSize: (v: 'S' | 'M' | 'L') => void;
  scripts: ScriptEntry[];
  currentVideos: VideoRef[];
  startNewScript: () => void;
  openScript: (entry: ScriptEntry) => void;
  saveScript: () => void;
  addVideoToCurrentScript: (video: VideoRef) => void;
  removeVideoFromCurrentScript: (uri: string) => void;
  deleteScript: (id: string) => void;
};

const ScriptContext = createContext<ScriptContextValue | null>(null);

export function ScriptProvider({ children }: { children: React.ReactNode }) {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [script, setScript] = useState('');
  const [speed, setSpeed] = useState(0.5);
  const [fontSize, setFontSize] = useState<'S' | 'M' | 'L'>('M');
  const [scripts, setScripts] = useState<ScriptEntry[]>(() => getAllScripts());

  const startNewScript = useCallback(() => {
    setCurrentId(null);
    setTitle('');
    setScript('');
  }, []);

  const openScript = useCallback((entry: ScriptEntry) => {
    setCurrentId(entry.id);
    setTitle(entry.title);
    setScript(entry.body);
  }, []);

  // Punto único de guardado: si currentId ya existe actualiza esa fila (no crea una nueva),
  // conserva los videos ya grabados y opcionalmente agrega uno nuevo al final.
  const persistCurrent = useCallback(
    (newVideo?: VideoRef) => {
      const id = currentId ?? `${Date.now()}`;
      const existing = scripts.find((s) => s.id === id);
      const entry: ScriptEntry = {
        id,
        // Sin traducir acá a propósito: un título vacío se guarda vacío, y la pantalla
        // que lo muestra resuelve el placeholder según el idioma activo en ese momento.
        title: title.trim(),
        body: script,
        videos: newVideo ? [...(existing?.videos ?? []), newVideo] : (existing?.videos ?? []),
        updatedAt: Date.now(),
      };
      upsertScript(entry);
      setCurrentId(id);
      setScripts((prev) => [entry, ...prev.filter((s) => s.id !== id)].sort((a, b) => b.updatedAt - a.updatedAt));
    },
    [currentId, title, script, scripts]
  );

  const saveScript = useCallback(() => persistCurrent(), [persistCurrent]);
  const addVideoToCurrentScript = useCallback(
    (video: VideoRef) => persistCurrent(video),
    [persistCurrent]
  );

  // No toca updatedAt: quitar un video que ya no existe no debe reordenar la lista.
  const removeVideoFromCurrentScript = useCallback(
    (uri: string) => {
      if (!currentId) return;
      setScripts((prev) => {
        const target = prev.find((s) => s.id === currentId);
        if (!target) return prev;
        const updated: ScriptEntry = { ...target, videos: target.videos.filter((v) => v.uri !== uri) };
        upsertScript(updated);
        return prev.map((s) => (s.id === currentId ? updated : s));
      });
    },
    [currentId]
  );

  const deleteScript = useCallback(
    (id: string) => {
      dbDeleteScript(id);
      setScripts((prev) => prev.filter((s) => s.id !== id));
      if (currentId === id) {
        setCurrentId(null);
        setTitle('');
        setScript('');
      }
    },
    [currentId]
  );

  const currentVideos = useMemo(
    () => scripts.find((s) => s.id === currentId)?.videos ?? [],
    [scripts, currentId]
  );

  const value = useMemo(
    () => ({
      title,
      setTitle,
      script,
      setScript,
      speed,
      setSpeed,
      fontSize,
      setFontSize,
      scripts,
      currentVideos,
      startNewScript,
      openScript,
      saveScript,
      addVideoToCurrentScript,
      removeVideoFromCurrentScript,
      deleteScript,
    }),
    [
      title,
      script,
      speed,
      fontSize,
      scripts,
      currentVideos,
      startNewScript,
      openScript,
      saveScript,
      addVideoToCurrentScript,
      removeVideoFromCurrentScript,
      deleteScript,
    ]
  );

  return <ScriptContext.Provider value={value}>{children}</ScriptContext.Provider>;
}

export function useScript() {
  const ctx = useContext(ScriptContext);
  if (!ctx) throw new Error('useScript debe usarse dentro de <ScriptProvider>');
  return ctx;
}
