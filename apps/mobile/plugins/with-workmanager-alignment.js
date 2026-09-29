const { withAppBuildGradle } = require("expo/config-plugins");

/**
 * The Android widget library uses androidx.work 2.8.x, while another dependency still pulls
 * work-runtime-ktx 2.7.1. Since 2.8 the -ktx classes live in work-runtime itself, so both
 * together fail with "Duplicate class androidx.work.OneTimeWorkRequestKt". Pinning -ktx to
 * the same version (where it's an empty shim) resolves it. Remove once nothing pulls 2.7.
 */
const MARKER = "// love-notes: align androidx.work";
const VERSION = "2.8.1";

module.exports = function withWorkManagerAlignment(config) {
  return withAppBuildGradle(config, (c) => {
    if (!c.modResults.contents.includes(MARKER)) {
      c.modResults.contents += `
${MARKER}
configurations.all {
    resolutionStrategy.force "androidx.work:work-runtime:${VERSION}", "androidx.work:work-runtime-ktx:${VERSION}"
}
`;
    }
    return c;
  });
};
