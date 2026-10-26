// Config plugin: permite fixar a versão do NDK usada no build Android.
// Útil quando a máquina de build tem só uma versão específica do NDK instalada.
// Uso: IMPOSTOR_NDK_VERSION=28.2.13676358 npx expo prebuild --platform android
// Sem a variável, o projeto usa a versão padrão do React Native.
const { withProjectBuildGradle } = require('expo/config-plugins');

module.exports = function withNdkVersion(config, props = {}) {
  const ndkVersion = process.env.IMPOSTOR_NDK_VERSION || props.ndkVersion;
  if (!ndkVersion) return config;
  return withProjectBuildGradle(config, (cfg) => {
    const marker = '// @impostor-ndk-version';
    if (!cfg.modResults.contents.includes(marker)) {
      cfg.modResults.contents = `${marker}\next { ndkVersion = "${ndkVersion}" }\n\n` + cfg.modResults.contents;
    }
    return cfg;
  });
};
