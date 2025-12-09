import { Config } from "@remotion/cli/config";

/**
 * Remotion Configuration
 * 
 * This file configures the Remotion bundler and Lambda rendering settings.
 * @see https://www.remotion.dev/docs/config
 */

// Webpack bundler configuration
Config.setEntryPoint("./src/index.ts");

// Output settings
Config.setCodec("h264");
Config.setCrf(18); // Quality: 0-51, lower = better
Config.setImageFormat("jpeg");
Config.setJpegQuality(90);

// Performance settings for Lambda
Config.setConcurrency(16); // Max concurrent renders
Config.setTimeoutInMilliseconds(60000); // 60s timeout per frame chunk

// Override output location
Config.setOutputLocation("./out");
