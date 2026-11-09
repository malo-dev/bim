// Configuration dynamique : reprend app.json tel quel, et ne change qu'une chose.
// google-services.json (Firebase, notifications push Android) n'est pas dans
// Git : sur EAS, il est fourni par la variable secrète de type fichier
// GOOGLE_SERVICES_JSON ; en local, on utilise ./google-services.json.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile,
  },
});
