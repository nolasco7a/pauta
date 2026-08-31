const { withPodfile } = require('@expo/config-plugins');

// ponytail: CocoaPods script phases (Check FBReactNativeSpec, RNGestureHandler codegen, etc.)
// declare no outputs, so xcodebuild's dependency analysis flags a false "Cycle inside
// RNGestureHandler" on CLI builds (Xcode GUI tolerates it). This survives `expo prebuild`,
// which otherwise regenerates ios/Podfile and drops a manual fix. Upgrade path: remove once
// upstream CocoaPods/React Native declare proper script phase outputs.
module.exports = function withGestureHandlerCycleFix(config) {
  return withPodfile(config, (config) => {
    if (!config.modResults.contents.includes('always_out_of_date')) {
      config.modResults.contents = config.modResults.contents.replace(
        'post_install do |installer|',
        `post_install do |installer|
    installer.pods_project.targets.each do |target|
      target.build_phases.each do |build_phase|
        build_phase.always_out_of_date = "1" if build_phase.respond_to?(:always_out_of_date=)
      end
    end
`
      );
    }
    return config;
  });
};
