import type {
    IHookFunctions,
    INodeType,
    INodeTypeDescription,
    IWebhookFunctions,
    IWebhookResponseData,
    IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { verifyWebhookMac } from '../shared/ZaloOAHelpers';

const ZALO_OA_EVENT_TYPES = [
    // Follow / Unfollow
    { name: 'Follow', value: 'follow', description: 'User followed this OA' },
    { name: 'Unfollow', value: 'unfollow', description: 'User unfollowed this OA' },
    // User DM to OA
    { name: 'User Sent Text', value: 'user_send_text', description: 'User sent a text message' },
    { name: 'User Sent Image', value: 'user_send_image', description: 'User sent an image' },
    { name: 'User Sent File', value: 'user_send_file', description: 'User sent a file' },
    { name: 'User Sent Audio', value: 'user_send_audio', description: 'User sent an audio message' },
    { name: 'User Sent Video', value: 'user_send_video', description: 'User sent a video' },
    { name: 'User Sent Sticker', value: 'user_send_sticker', description: 'User sent a sticker' },
    { name: 'User Sent GIF', value: 'user_send_gif', description: 'User sent a GIF' },
    { name: 'User Sent Link', value: 'user_send_link', description: 'User sent a link' },
    { name: 'User Sent Location', value: 'user_send_location', description: 'User shared a location' },
    { name: 'User Sent Business Card', value: 'user_send_business_card', description: 'User sent a business card' },
    // User interactions
    { name: 'User Clicked Button', value: 'user_click_button', description: 'User clicked a message button' },
    { name: 'User Clicked Link', value: 'user_click_link', description: 'User clicked a link in message' },
    // Group chat (user)
    { name: 'User Sent Group Text', value: 'user_send_group_text', description: 'User sent text in a group chat' },
    { name: 'User Sent Group Image', value: 'user_send_group_image', description: 'User sent image in group chat' },
    { name: 'User Sent Group File', value: 'user_send_group_file', description: 'User sent file in group chat' },
    { name: 'User Sent Group Sticker', value: 'user_send_group_sticker', description: 'User sent sticker in group chat' },
    { name: 'User Sent Group GIF', value: 'user_send_group_gif', description: 'User sent GIF in group chat' },
    // Tag management
    { name: 'Tag Added to User', value: 'add_user_to_tag', description: 'A tag was added to a user' },
    // Calls
    { name: 'User Called OA', value: 'user_call_oa', description: 'User initiated a voice/video call to OA' },
    // All events
    { name: 'All Events (*)', value: '*', description: 'Receive every event without filtering' },
];

export class ZaloOAWebhook implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Zalo OA Webhook Trigger',
        name: 'zaloOAWebhook',
        icon: 'file:../shared/zalooa.svg',
        group: ['trigger'],
        version: 1,
        description: 'Triggers workflow on Zalo OA events (follow, messages, button clicks)',
        defaults: { name: 'Zalo OA Webhook' },
        inputs: [],
        outputs: [NodeConnectionTypes.Main],
        credentials: [{ name: 'zaloOAApi', required: true }],
        webhooks: [
            {
                name: 'default',
                httpMethod: '={{$parameter["httpMethod"]}}',
                responseMode: 'onReceived',
                path: 'zalooa-webhook',
            },
        ],
        properties: [
            {
                displayName: 'HTTP Method',
                name: 'httpMethod',
                type: 'options',
                options: [
                    { name: 'GET (Webhook Verification)', value: 'GET' },
                    { name: 'POST (Receive Events)', value: 'POST' },
                ],
                default: 'POST',
                description: 'GET is used only during initial webhook registration with Zalo',
            },
            {
                displayName: 'Event Types',
                name: 'eventTypes',
                type: 'multiOptions',
                options: ZALO_OA_EVENT_TYPES,
                default: ['follow', 'user_send_text'],
                description: 'Which OA events to handle (select All Events to disable filtering)',
            },
            {
                displayName: 'Verify MAC Signature',
                name: 'verifyMac',
                type: 'boolean',
                default: true,
                description: 'Whether to validate the HMAC-SHA256 MAC signature on incoming events using the App Secret',
            },
        ],
    };

    webhookMethods = {
        default: {
            async checkExists(this: IHookFunctions): Promise<boolean> {
                return this.getWorkflowStaticData('node').webhookRegistered === true;
            },

            async create(this: IHookFunctions): Promise<boolean> {
                const webhookUrl = this.getNodeWebhookUrl('default') as string;
                this.getWorkflowStaticData('node').webhookUrl = webhookUrl;
                this.getWorkflowStaticData('node').webhookRegistered = true;
                return true;
            },

            async delete(this: IHookFunctions): Promise<boolean> {
                const data = this.getWorkflowStaticData('node');
                delete data.webhookUrl;
                delete data.webhookRegistered;
                return true;
            },
        },
    };

    async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
        const req = this.getRequestObject();
        const res = this.getResponseObject();

        // GET: Zalo OA webhook verification handshake
        if (req.method === 'GET') {
            const challenge = req.query['hub.challenge'] as string | undefined;
            if (challenge) {
                res.status(200).send(challenge);
                return { noWebhookResponse: true };
            }
            res.status(200).send('OK');
            return { noWebhookResponse: true };
        }

        // POST: incoming event
        const body = req.body as IDataObject;
        const verifyMac = this.getNodeParameter('verifyMac') as boolean;

        if (verifyMac) {
            const credentials = await this.getCredentials('zaloOAApi');
            const appId = credentials.appId as string;
            const appSecret = credentials.appSecret as string;

            if (appId && appSecret) {
                // Zalo OA sends: X-ZEvent-Signature: mac = <sha256hex>
                const sigHeader = (req.headers['x-zevent-signature'] ?? req.headers['x-zalo-signature']) as string | undefined;
                if (!sigHeader) {
                    throw new NodeOperationError(this.getNode(), 'Missing X-ZEvent-Signature header — MAC verification failed');
                }
                // Strip "mac = " prefix if present
                const receivedMac = sigHeader.replace(/^mac\s*=\s*/i, '').trim();

                const rawBody = JSON.stringify(body);
                const timestamp = String(body.timestamp ?? '');

                if (!verifyWebhookMac(appId, appSecret, rawBody, timestamp, receivedMac)) {
                    res.status(401).send('Invalid MAC signature');
                    return { noWebhookResponse: true };
                }
            }
        }

        // Filter by event type
        const eventTypes = this.getNodeParameter('eventTypes') as string[];
        const eventName = (body.event_name as string) ?? '';

        if (!eventTypes.includes('*') && eventTypes.length > 0 && !eventTypes.includes(eventName)) {
            res.status(200).send('OK');
            return { noWebhookResponse: true };
        }

        return {
            workflowData: [this.helpers.returnJsonArray(body)],
        };
    }
}
