import { getExt, storageGet, storageSet } from './browser-api';
import { API_SECRET, MEASUREMENT_ID } from './analytics-config';

const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const GA_DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect';
const SESSION_EXPIRATION_IN_MIN = 30;
const DEFAULT_ENGAGEMENT_TIME_IN_MSEC = 100;
const DEBUG = false;

function getRandomId() {
  const digits = '123456789';
  let result = '';
  for (let i = 0; i < 10; i += 1) {
    result += digits[Math.floor(Math.random() * digits.length)];
  }
  return result;
}

function sessionGet(keys) {
  const api = getExt();
  const area = api.storage?.session || api.storage.local;
  const result = area.get(keys);
  if (result && typeof result.then === 'function') return result;
  return new Promise((resolve, reject) => {
    try {
      area.get(keys, (data) => {
        const err = api.runtime?.lastError;
        if (err) reject(new Error(err.message));
        else resolve(data);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function sessionSet(values) {
  const api = getExt();
  const area = api.storage?.session || api.storage.local;
  const result = area.set(values);
  if (result && typeof result.then === 'function') return result;
  return new Promise((resolve, reject) => {
    try {
      area.set(values, () => {
        const err = api.runtime?.lastError;
        if (err) reject(new Error(err.message));
        else resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function getOrCreateClientId() {
  const result = await storageGet('gaClientId');
  let clientId = result.gaClientId;
  if (!clientId) {
    const unixTimestampSeconds = Math.floor(Date.now() / 1000);
    clientId = `${getRandomId()}.${unixTimestampSeconds}`;
    await storageSet({ gaClientId: clientId });
  }
  return clientId;
}

export async function getOrCreateSessionId() {
  let { gaSessionData: sessionData } = await sessionGet('gaSessionData');
  const currentTimeInMs = Date.now();

  if (sessionData?.timestamp) {
    const durationInMin = (currentTimeInMs - Number(sessionData.timestamp)) / 60000;
    if (durationInMin > SESSION_EXPIRATION_IN_MIN) {
      sessionData = null;
    } else {
      sessionData.timestamp = currentTimeInMs;
      await sessionSet({ gaSessionData: sessionData });
    }
  }

  if (!sessionData) {
    sessionData = {
      session_id: String(currentTimeInMs),
      timestamp: currentTimeInMs,
    };
    await sessionSet({ gaSessionData: sessionData });
  }

  return sessionData.session_id;
}

function isConfigured() {
  return Boolean(
    MEASUREMENT_ID &&
      API_SECRET &&
      API_SECRET !== 'YOUR_API_SECRET'
  );
}

export async function trackEvent(name, params = {}) {
  if (!isConfigured()) return;

  try {
    const clientId = await getOrCreateClientId();
    const sessionId = await getOrCreateSessionId();
    const endpoint = DEBUG ? GA_DEBUG_ENDPOINT : GA_ENDPOINT;

    await fetch(
      `${endpoint}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId,
          events: [
            {
              name,
              params: {
                session_id: sessionId,
                engagement_time_msec: DEFAULT_ENGAGEMENT_TIME_IN_MSEC,
                ...params,
              },
            },
          ],
        }),
      }
    );
  } catch {
    // Analytics must never break extension features.
  }
}

export async function trackPageView(pageTitle, pageLocation) {
  const title =
    pageTitle ||
    (typeof document !== 'undefined' ? document.title : 'WhatColor');
  const href =
    pageLocation ||
    (typeof globalThis !== 'undefined' && globalThis.location?.href
      ? globalThis.location.href
      : pageTitle || 'extension');

  return trackEvent('page_view', {
    page_title: title,
    page_location: href,
  });
}
