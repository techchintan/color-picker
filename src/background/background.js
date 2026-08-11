import { onInstalled, onStartup, getExt } from '../lib/browser-api';
import { ensureDefaults } from '../lib/storage';
import { trackEvent } from '../lib/analytics';

onInstalled(async (details) => {
  await ensureDefaults();

  if (details?.reason === 'install') {
    await trackEvent('extension_installed', {
      version: getExt().runtime.getManifest().version,
    });
  } else if (details?.reason === 'update') {
    await trackEvent('extension_updated', {
      previous_version: details.previousVersion || '',
      current_version: getExt().runtime.getManifest().version,
    });
  }
});

onStartup(async () => {
  await ensureDefaults();
});

self.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  trackEvent('extension_error', {
    message: reason?.message || String(reason || 'unknown'),
    stack: reason?.stack || '',
  });
});
