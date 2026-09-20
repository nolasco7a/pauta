import { Still, staticFile } from 'remotion';
import { screens } from './screens';
import { Screenshot } from './Screenshot';

// PLATFORM selects the public/<platform>/ folder the images come from.
// To add another platform: drop matching files in public/<platform>/,
// register its extension below, and run `PLATFORM=<platform> npm run render`.
const platform = process.env.PLATFORM ?? 'android';

const EXT_BY_PLATFORM: Record<string, string> = {
  android: 'jpg',
  ios: 'png',
};
const ext = EXT_BY_PLATFORM[platform] ?? 'jpg';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {screens.map((screen) => (
        <Still
          key={screen.id}
          id={screen.id}
          component={Screenshot}
          width={1080}
          height={1920}
          defaultProps={{
            image: staticFile(`${platform}/${screen.file}.${ext}`),
            caption: screen.caption,
          }}
        />
      ))}
    </>
  );
};
