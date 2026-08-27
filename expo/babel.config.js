module.exports = function (api) {
  // Re-evaluate the config per NODE_ENV so the production-only console strip
  // is applied correctly for production bundles but not in dev.
  api.cache.using(() => process.env.NODE_ENV);

  const isProduction = process.env.NODE_ENV === 'production';

  const plugins = [];
  if (isProduction) {
    // Strip console.* from production builds so verbose request/response logging
    // (which included auth tokens and full user profiles) never reaches real
    // devices' system logs. Keep error/warn for crash diagnostics + Sentry.
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
