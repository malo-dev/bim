const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Config plugin — génère PrivacyInfo.xcprivacy dans ios/<appName>/
 * Requis par Apple depuis iOS 17 / Xcode 15.
 *
 * NSPrivacyAccessedAPITypes déclarés :
 *   - NSUserDefaults  (AsyncStorage utilise NSUserDefaults en natif)
 *
 * NSPrivacyCollectedDataTypes déclarés :
 *   - Email           (authentification, lié à l'utilisateur)
 *   - Location        (enregistré lors de la connexion, lié à l'utilisateur)
 *   - Device ID       (nom de l'appareil envoyé au login, lié à l'utilisateur)
 *   - User ID         (stocké localement après connexion)
 */
const withPrivacyManifest = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const iosDir = path.join(cfg.modRequest.platformProjectRoot, cfg.modRequest.projectName);
      const filePath = path.join(iosDir, "PrivacyInfo.xcprivacy");

      const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>

  <!-- L'app ne fait pas de tracking cross-app -->
  <key>NSPrivacyTracking</key>
  <false/>

  <!-- Aucun domaine de tracking -->
  <key>NSPrivacyTrackingDomains</key>
  <array/>

  <!-- APIs système accédées -->
  <key>NSPrivacyAccessedAPITypes</key>
  <array>

    <!-- AsyncStorage utilise NSUserDefaults en natif iOS -->
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <!-- CA92.1 : accès aux données stockées par cette app -->
        <string>CA92.1</string>
      </array>
    </dict>

  </array>

  <!-- Données collectées par l'app -->
  <key>NSPrivacyCollectedDataTypes</key>
  <array>

    <!-- Adresse e-mail (authentification) -->
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeEmailAddress</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>

    <!-- Localisation (enregistrée lors de la connexion) -->
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypePreciseLocation</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>

    <!-- Identifiant utilisateur (stocké après connexion) -->
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeUserID</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>

    <!-- Nom/modèle de l'appareil (envoyé lors de la connexion) -->
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeDeviceID</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>

  </array>

</dict>
</plist>
`;

      fs.mkdirSync(iosDir, { recursive: true });
      fs.writeFileSync(filePath, content, "utf8");

      return cfg;
    },
  ]);
};

module.exports = withPrivacyManifest;
