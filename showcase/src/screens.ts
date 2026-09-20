export interface ScreenshotConfig {
  id: string;
  file: string;
  caption: string;
}

// One entry per store screenshot. `file` has no extension — each platform
// folder (public/<platform>/) keeps its own format, see EXT_BY_PLATFORM in
// Root.tsx. Same base filename must exist under every platform folder.
// Wrap one word in **asterisks** to highlight it in the brand gold accent.
export const screens: ScreenshotConfig[] = [
  { id: 'dashboard', file: 'dashboard', caption: 'Organize your **scripts**' },
  { id: 'scripts-list', file: 'scripts-list-screen', caption: 'All your scripts, **one place**' },
  { id: 'script-editor', file: 'script-editor-screen', caption: 'Write and **fine-tune** your script' },
  { id: 'camera', file: 'camera-screen', caption: 'Record with a **teleprompter**' },
  { id: 'camera-settings', file: 'camera-screen-camera-settings-open', caption: 'Full **camera** control' },
  { id: 'teleprompter-settings', file: 'camera-screen-teleprompter-settings-open', caption: '**Customize** your teleprompter' },
];
