import { onInstalled, onStartup } from '../lib/browser-api';
import { ensureDefaults } from '../lib/storage';

onInstalled(async () => {
  await ensureDefaults();
});

onStartup(async () => {
  await ensureDefaults();
});
