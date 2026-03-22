import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeVersion, getStabilityScore, generateLinks } from './index.ts';

describe('Playwright Crawler Logic', () => {

  test('normalizeVersion: should merge identical versions with different revisions', () => {
    const v1 = "111.0.5563.33 (1050)";
    const v2 = "111.0.5563.33 (1049)";
    
    assert.equal(normalizeVersion(v1), "111.0.5563.33");
    assert.equal(normalizeVersion(v2), "111.0.5563.33");
    assert.equal(normalizeVersion(v1), normalizeVersion(v2));
  });

  test('getStabilityScore: should prioritize stable versions over pre-releases', () => {
    assert.equal(getStabilityScore("1.40.0"), 0);        // Stable
    assert.equal(getStabilityScore("1.40.0-beta.1"), 1); // Beta
    assert.equal(getStabilityScore("1.40.0-alpha.1"), 2); // Alpha
    assert.equal(getStabilityScore("1.40.0-next.1"), 3);  // Next
    
    // Check sorting logic: lower score is better
    assert.ok(getStabilityScore("1.40.0") < getStabilityScore("1.40.0-alpha.1"));
  });

  describe('generateLinks', () => {
    test('should generate Chrome for Testing (CfT) links for Chromium >= 115', () => {
      const mockBrowsers = {
        chromium: { v: '115.0.5790.24', rev: '1067' }
      };
      const links = generateLinks(mockBrowsers, '1.35.0');
      
      assert.ok(links.chromium.win64.includes('googlechromelabs.github.io/chrome-for-testing') || 
                links.chromium.win64.includes('builds/cft'), 'Should use CfT path');
      assert.ok(links.chromium.mac_arm, 'Should include Apple Silicon build for modern Chrome');
    });

    test('should use legacy paths for older Playwright versions', () => {
      const mockBrowsers = {
        webkit: { v: '15.4', rev: '1000' }
      };
      // For PW < 1.40
      const links = generateLinks(mockBrowsers, '1.39.0');
      
      assert.ok(!links.webkit.win64.includes('dbazure'), 'Should not use azure path for legacy PW');
      assert.ok(links.webkit.win64.includes('cdn.playwright.dev/builds/webkit/1000'), 'Standard CDN path');
    });

    test('should handle missing revisions gracefully', () => {
      const emptyBrowsers = { chromium: { v: '', rev: '' } };
      const links = generateLinks(emptyBrowsers, '1.40.0');
      assert.deepEqual(links, {}, 'Should return empty object if no revisions found');
    });
  });
});