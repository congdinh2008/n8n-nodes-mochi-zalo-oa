import { createHash } from 'crypto';
import type { IExecuteFunctions, IDataObject, IHttpRequestOptions } from 'n8n-workflow';

export const ZALO_OA_V3_BASE = 'https://openapi.zalo.me/v3.0/oa';
export const ZALO_OA_V2_BASE = 'https://openapi.zalo.me/v2.0/oa';

export type MessageType = 'cs' | 'transaction' | 'promotion';

/**
 * Make an authenticated request to Zalo OA v3.0 API.
 */
export async function zaloRequest(
    ctx: IExecuteFunctions,
    options: IHttpRequestOptions,
    baseUrl = ZALO_OA_V3_BASE,
): Promise<IDataObject> {
    const merged: IHttpRequestOptions = {
        ...options,
        baseURL: baseUrl,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };
    return ctx.helpers.httpRequestWithAuthentication.call(ctx, 'zaloOAApi', merged) as Promise<IDataObject>;
}

/**
 * Build the MAC payload string for Zalo OA webhook verification.
 * Official formula: SHA256(appId + data + timeStamp + appSecret)
 * where data is the raw JSON body string.
 */
export function buildMacPayload(appId: string, data: string, timestamp: string): string {
    return `${appId}${data}${timestamp}`;
}

/**
 * Verify a Zalo OA webhook MAC signature.
 * Zalo uses SHA256(appId + rawBody + timeStamp + appSecret) — NOT HMAC.
 * The header is X-ZEvent-Signature; value format: "mac = <hex>"
 */
export function verifyWebhookMac(
    appId: string,
    appSecret: string,
    rawBody: string,
    timestamp: string,
    receivedMac: string,
): boolean {
    const payload = `${appId}${rawBody}${timestamp}${appSecret}`;
    const expected = createHash('sha256').update(payload).digest('hex');
    return expected === receivedMac;
}

/**
 * Encode a data parameter as JSON string (used in Zalo OA GET requests).
 */
export function encodeDataParam(data: IDataObject): string {
    return JSON.stringify(data);
}
