import type {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class ZaloOAApi implements ICredentialType {
    name = 'zaloOAApi';
    displayName = 'Zalo Official Account API';
    documentationUrl = 'https://developers.zalo.me/docs/official-account';
    properties: INodeProperties[] = [
        {
            displayName: 'App ID',
            name: 'appId',
            type: 'string',
            default: '',
            description: 'Zalo App ID from developers.zalo.me',
        },
        {
            displayName: 'App Secret',
            name: 'appSecret',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            description: 'Zalo App Secret Key — also used to verify webhook MAC signatures',
        },
        {
            displayName: 'Access Token',
            name: 'accessToken',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            required: true,
            description: 'OA Access Token from Zalo OA management portal',
        },
        {
            displayName: 'Refresh Token',
            name: 'refreshToken',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            description: 'Refresh Token for renewing Access Token when it expires',
        },
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                access_token: '={{ $credentials.accessToken }}',
            },
        },
    };

    test: ICredentialTestRequest = {
        request: {
            baseURL: 'https://openapi.zalo.me/v3.0/oa',
            url: '/getoa',
            method: 'GET',
        },
    };
}
