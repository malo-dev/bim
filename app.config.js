// Configuration dynamique : reprend app.json tel quel, avec deux ajouts.
const { withGradleProperties } = require('expo/config-plugins');

// Compilation Android sur les machines EAS : sans limite, Gradle et Kotlin
// dépassaient la mémoire disponible (« Gradle build daemon disappeared
// unexpectedly »). On borne la mémoire et le parallélisme.
const GRADLE_PROPS = {
  'org.gradle.jvmargs': '-Xmx3g -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8',
  'org.gradle.parallel': 'false',
  'org.gradle.workers.max': '2',
  'kotlin.daemon.jvmargs': '-Xmx1536m',
  // Code natif (C++) compilé seulement pour les vrais téléphones : x86 et
  // x86_64 ne servent qu'aux émulateurs et doublaient la mémoire nécessaire.
  reactNativeArchitectures: 'armeabi-v7a,arm64-v8a',
};

const withLimitedGradleMemory = (config) =>
  withGradleProperties(config, (c) => {
    for (const [key, value] of Object.entries(GRADLE_PROPS)) {
      c.modResults = c.modResults.filter((p) => !(p.type === 'property' && p.key === key));
      c.modResults.push({ type: 'property', key, value });
    }
    return c;
  });

module.exports = ({ config }) =>
  withLimitedGradleMemory({
    ...config,
    android: {
      ...config.android,
      // google-services.json (Firebase, notifications push Android) n'est pas
      // dans Git : sur EAS, il vient de la variable secrète de type fichier
      // GOOGLE_SERVICES_JSON ; en local, on utilise ./google-services.json.
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile,
    },
  });
