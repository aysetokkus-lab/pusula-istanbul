const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

function fixBuildConfig(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const androidPackage = config.android?.package || "com.pusulaistanbul.app";
      const packagePath = androidPackage.replace(/\./g, "/");
      const basePath = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "java",
        packagePath
      );

      // Fix MainActivity.kt
      const mainActivityPath = path.join(basePath, "MainActivity.kt");
      if (fs.existsSync(mainActivityPath)) {
        let content = fs.readFileSync(mainActivityPath, "utf8");
        // Fix package declaration if wrong
        content = content.replace(
          /^package .+$/m,
          `package ${androidPackage}`
        );
        fs.writeFileSync(mainActivityPath, content);
        console.log("[fix-buildconfig] Fixed MainActivity.kt package declaration");
      }

      // Fix MainApplication.kt
      const mainAppPath = path.join(basePath, "MainApplication.kt");
      if (fs.existsSync(mainAppPath)) {
        let content = fs.readFileSync(mainAppPath, "utf8");
        // Fix package declaration if wrong
        content = content.replace(
          /^package .+$/m,
          `package ${androidPackage}`
        );
        fs.writeFileSync(mainAppPath, content);
        console.log("[fix-buildconfig] Fixed MainApplication.kt package declaration");
      }

      return config;
    },
  ]);
}

module.exports = fixBuildConfig;
