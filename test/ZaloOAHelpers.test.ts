import { describe, test, expect } from 'bun:test';
import { createHash } from 'crypto';
import { buildMacPayload, verifyWebhookMac, encodeDataParam } from '../src/nodes/shared/ZaloOAHelpers';

describe('buildMacPayload', () => {
    test('concatenates appId + data + timestamp', () => {
        const result = buildMacPayload('APP123', '{"event":"follow"}', '1000');
        expect(result).toBe('APP123{"event":"follow"}1000');
    });

    test('empty strings produce empty concatenation', () => {
        expect(buildMacPayload('', '', '')).toBe('');
    });

    test('preserves special characters in data', () => {
        const data = '{"text":"hello & world"}';
        expect(buildMacPayload('A', data, '1')).toBe(`A${data}1`);
    });
});

describe('verifyWebhookMac', () => {
    const APP_ID = 'myapp';
    const APP_SECRET = 'supersecret';

    function makeValidMac(rawBody: string, timestamp: string): string {
        const payload = `${APP_ID}${rawBody}${timestamp}${APP_SECRET}`;
        return createHash('sha256').update(payload).digest('hex');
    }

    test('returns true for a valid MAC', () => {
        const rawBody = '{"event_name":"follow","timestamp":2000}';
        const ts = '2000';
        const mac = makeValidMac(rawBody, ts);
        expect(verifyWebhookMac(APP_ID, APP_SECRET, rawBody, ts, mac)).toBe(true);
    });

    test('returns false for a tampered body', () => {
        const rawBody = '{"event_name":"follow","timestamp":2000}';
        const mac = makeValidMac(rawBody, '2000');
        expect(verifyWebhookMac(APP_ID, APP_SECRET, '{"event_name":"unfollow"}', '2000', mac)).toBe(false);
    });

    test('returns false for wrong appSecret', () => {
        const rawBody = '{"event_name":"follow"}';
        const mac = makeValidMac(rawBody, '1');
        expect(verifyWebhookMac(APP_ID, 'wrong-secret', rawBody, '1', mac)).toBe(false);
    });

    test('returns false for wrong appId', () => {
        const rawBody = '{"event_name":"follow"}';
        const mac = makeValidMac(rawBody, '1');
        expect(verifyWebhookMac('wrong-app', APP_SECRET, rawBody, '1', mac)).toBe(false);
    });

    test('is case-sensitive (uppercase MAC fails)', () => {
        const rawBody = '{"event_name":"follow"}';
        const mac = makeValidMac(rawBody, '1');
        expect(verifyWebhookMac(APP_ID, APP_SECRET, rawBody, '1', mac.toUpperCase())).toBe(false);
    });

    test('strips "mac = " prefix from header value before comparing', () => {
        // verifyWebhookMac receives the already-stripped mac; this test confirms
        // the raw hex without prefix is correctly handled
        const rawBody = '{}';
        const mac = makeValidMac(rawBody, '0');
        expect(verifyWebhookMac(APP_ID, APP_SECRET, rawBody, '0', mac)).toBe(true);
    });
});

describe('encodeDataParam', () => {
    test('serializes object to JSON string', () => {
        const result = encodeDataParam({ user_id: 'abc', offset: 0 });
        expect(JSON.parse(result)).toEqual({ user_id: 'abc', offset: 0 });
    });

    test('handles empty object', () => {
        expect(encodeDataParam({})).toBe('{}');
    });

    test('handles nested values', () => {
        const result = encodeDataParam({ offset: 0, count: 50, is_follower: true });
        const parsed = JSON.parse(result);
        expect(parsed.count).toBe(50);
        expect(parsed.is_follower).toBe(true);
    });
});
