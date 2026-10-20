import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyExploreError, OfflineError } from '../src/lib/explore-service';

// Message prefixes mirror src/services/googleMapsService.ts
// (describePlacesError billing branch, the SDK-not-loaded guard, and the withTimeout rejection).

test('an OfflineError instance classifies as "offline"', () => {
  assert.equal(classifyExploreError(new OfflineError()), 'offline');
});

test('an Error named "OfflineError" classifies as "offline"', () => {
  const err = new Error('whatever');
  err.name = 'OfflineError';
  assert.equal(classifyExploreError(err), 'offline');
});

test('the Google billing/permission message classifies as "billing"', () => {
  const err = new Error(
    'Google rejected the charger search. Enable billing and "Places API (New)" on the API key\'s Google Cloud project, and allow that API in the key\'s restrictions.',
  );
  assert.equal(classifyExploreError(err), 'billing');
});

test('the SDK "has not finished loading" message classifies as "billing"', () => {
  const err = new Error('Google Maps has not finished loading. Please try again.');
  assert.equal(classifyExploreError(err), 'billing');
});

test('the timeout "did not respond" message classifies as "timeout"', () => {
  const err = new Error('Google Places did not respond. Check the browser console for Google Maps errors.');
  assert.equal(classifyExploreError(err), 'timeout');
});

test('a random Error classifies as "unknown"', () => {
  assert.equal(classifyExploreError(new Error('Charger search failed: ZERO_RESULTS')), 'unknown');
});

test('a non-Error value (string) classifies as "unknown"', () => {
  assert.equal(classifyExploreError('something went wrong'), 'unknown');
});

test('a non-Error value (undefined) classifies as "unknown"', () => {
  assert.equal(classifyExploreError(undefined), 'unknown');
});
