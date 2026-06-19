import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import {
    resourceOptions,
    allOperations,
    allFields,
} from './ZaloOADescription';
import {
    zaloRequest,
    ZALO_OA_V2_BASE,
    encodeDataParam,
    type MessageType,
} from '../shared/ZaloOAHelpers';

export class ZaloOA implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Zalo OA',
        name: 'zaloOA',
        icon: 'file:../shared/zalooa.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"] + " · " + $parameter["resource"]}}',
        description: 'Interact with Zalo Official Account API v3.0',
        defaults: { name: 'Zalo OA' },
        inputs: [NodeConnectionTypes.Main],
        outputs: [NodeConnectionTypes.Main],
        credentials: [{ name: 'zaloOAApi', required: true }],
        properties: [resourceOptions, ...allOperations, ...allFields],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            try {
                const resource = this.getNodeParameter('resource', i) as string;
                const operation = this.getNodeParameter('operation', i) as string;
                let result: IDataObject;

                if (resource === 'message') {
                    result = await handleMessage(this, i, operation);
                } else if (resource === 'follower') {
                    result = await handleFollower(this, i, operation);
                } else if (resource === 'oa') {
                    result = await zaloRequest(this, { url: '/getoa', method: 'GET' });
                } else if (resource === 'media') {
                    result = await handleMedia(this, i, operation);
                } else if (resource === 'tag') {
                    result = await handleTag(this, i, operation);
                } else if (resource === 'menu') {
                    result = await handleMenu(this, i);
                } else if (resource === 'article') {
                    result = await handleArticle(this, i, operation);
                } else if (resource === 'store') {
                    result = await handleStore(this, i, operation);
                } else if (resource === 'conversation') {
                    result = await handleConversation(this, i, operation);
                } else {
                    throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, { itemIndex: i });
                }

                returnData.push({ json: result, pairedItem: { item: i } });
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
                    continue;
                }
                throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
            }
        }

        return [returnData];
    }
}

// ─── MESSAGE ─────────────────────────────────────────────────────────────────

async function handleMessage(ctx: IExecuteFunctions, i: number, operation: string): Promise<IDataObject> {
    if (operation === 'getStatus') {
        const messageId = ctx.getNodeParameter('messageId', i) as string;
        return zaloRequest(ctx, {
            url: '/message/status',
            method: 'POST',
            body: { message_id: messageId },
        });
    }

    const userId = ctx.getNodeParameter('userId', i) as string;
    const messageType = ctx.getNodeParameter('messageType', i) as MessageType;
    const endpoint = `/message/${messageType}`;

    if (operation === 'sendText') {
        const text = ctx.getNodeParameter('text', i) as string;
        return zaloRequest(ctx, {
            url: endpoint,
            method: 'POST',
            body: {
                recipient: { user_id: userId },
                message: { text },
            },
        });
    }

    if (operation === 'sendImage') {
        const imageSource = ctx.getNodeParameter('imageSource', i) as string;
        const element =
            imageSource === 'url'
                ? { media_type: 'image', url: ctx.getNodeParameter('imageUrl', i) as string }
                : { media_type: 'image', attachment_id: ctx.getNodeParameter('attachmentId', i) as string };

        return zaloRequest(ctx, {
            url: endpoint,
            method: 'POST',
            body: {
                recipient: { user_id: userId },
                message: {
                    attachment: {
                        type: 'template',
                        payload: { template_type: 'media', elements: [element] },
                    },
                },
            },
        });
    }

    if (operation === 'sendFile') {
        const fileToken = ctx.getNodeParameter('fileToken', i) as string;
        return zaloRequest(ctx, {
            url: endpoint,
            method: 'POST',
            body: {
                recipient: { user_id: userId },
                message: {
                    attachment: { type: 'file', payload: { token: fileToken } },
                },
            },
        });
    }

    if (operation === 'sendList') {
        const listTitle = ctx.getNodeParameter('listTitle', i) as string;
        const listButtonUrl = ctx.getNodeParameter('listButtonUrl', i) as string;
        const elementsCollection = ctx.getNodeParameter('elements.values', i, []) as Array<{
            title: string;
            subtitle: string;
            imageUrl: string;
            actionUrl: string;
        }>;

        const elements = elementsCollection.map((el) => ({
            title: el.title,
            subtitle: el.subtitle,
            image_url: el.imageUrl,
            default_action: { type: 'oa.open.url', url: el.actionUrl },
        }));

        return zaloRequest(ctx, {
            url: endpoint,
            method: 'POST',
            body: {
                recipient: { user_id: userId },
                message: {
                    attachment: {
                        type: 'template',
                        payload: {
                            template_type: 'list',
                            elements,
                            buttons: [{ title: listTitle, type: 'oa.open.url', payload: { url: listButtonUrl } }],
                        },
                    },
                },
            },
        });
    }

    if (operation === 'sendSticker') {
        const stickerId = ctx.getNodeParameter('stickerId', i) as string;
        return zaloRequest(ctx, {
            url: endpoint,
            method: 'POST',
            body: {
                recipient: { user_id: userId },
                message: {
                    attachment: { type: 'template', payload: { template_type: 'media', elements: [{ media_type: 'sticker', attachment_id: stickerId }] } },
                },
            },
        });
    }

    throw new NodeOperationError(ctx.getNode(), `Unknown message operation: ${operation}`);
}

// ─── FOLLOWER ─────────────────────────────────────────────────────────────────

async function handleFollower(ctx: IExecuteFunctions, i: number, operation: string): Promise<IDataObject> {
    if (operation === 'getInfo') {
        const userId = ctx.getNodeParameter('userId', i) as string;
        return zaloRequest(ctx, {
            url: '/user/detail',
            method: 'GET',
            qs: { data: encodeDataParam({ user_id: userId }) },
        });
    }

    if (operation === 'getList') {
        const offset = ctx.getNodeParameter('offset', i) as number;
        const count = ctx.getNodeParameter('count', i) as number;
        return zaloRequest(ctx, {
            url: '/user/getlist',
            method: 'GET',
            qs: { data: encodeDataParam({ offset, count }) },
        });
    }

    if (operation === 'update') {
        const userId = ctx.getNodeParameter('userId', i) as string;
        const displayName = ctx.getNodeParameter('displayName', i) as string;
        const additionalFields = ctx.getNodeParameter('additionalFields', i) as IDataObject;

        const body: IDataObject = { user_id: userId };
        if (displayName) body.name = displayName;
        if (additionalFields.city) body.city = additionalFields.city;
        if (additionalFields.district) body.district = additionalFields.district;
        if (additionalFields.address) body.address = additionalFields.address;
        if (additionalFields.phone) body.phone = additionalFields.phone;
        if (additionalFields.notes) body.notes = additionalFields.notes;

        return zaloRequest(ctx, { url: '/user/update', method: 'POST', body });
    }

    throw new NodeOperationError(ctx.getNode(), `Unknown follower operation: ${operation}`);
}

// ─── MEDIA ───────────────────────────────────────────────────────────────────

async function handleMedia(ctx: IExecuteFunctions, i: number, operation: string): Promise<IDataObject> {
    const urlMap: Record<string, string> = {
        uploadImage: '/upload/image',
        uploadFile: '/upload/file',
        uploadGif: '/upload/gif',
    };
    const uploadUrl = urlMap[operation];
    if (!uploadUrl) throw new NodeOperationError(ctx.getNode(), `Unknown media operation: ${operation}`);

    const useBinary = ctx.getNodeParameter('binaryData', i) as boolean;

    if (useBinary) {
        const binaryProperty = ctx.getNodeParameter('binaryProperty', i) as string;
        const binaryFile = ctx.getInputData()[i].binary?.[binaryProperty];
        if (!binaryFile) {
            throw new NodeOperationError(
                ctx.getNode(),
                `No binary data property "${binaryProperty}" found on item`,
                { itemIndex: i },
            );
        }
        const buffer = await ctx.helpers.getBinaryDataBuffer(i, binaryProperty);
        const form = new FormData();
        form.append(
            'file',
            new Blob([buffer], { type: binaryFile.mimeType }),
            binaryFile.fileName ?? 'file',
        );
        return ctx.helpers.httpRequestWithAuthentication.call(ctx, 'zaloOAApi', {
            url: uploadUrl,
            baseURL: 'https://openapi.zalo.me/v3.0/oa',
            method: 'POST',
            body: form,
        }) as Promise<IDataObject>;
    }

    const mediaUrl = ctx.getNodeParameter('mediaUrl', i) as string;
    return zaloRequest(ctx, { url: uploadUrl, method: 'POST', body: { url: mediaUrl } });
}

// ─── TAG ─────────────────────────────────────────────────────────────────────

async function handleTag(ctx: IExecuteFunctions, i: number, operation: string): Promise<IDataObject> {
    if (operation === 'getList') {
        const offset = ctx.getNodeParameter('offset', i) as number;
        const count = ctx.getNodeParameter('count', i) as number;
        return zaloRequest(ctx, { url: '/tag/gettagsofoa', method: 'GET', qs: { offset, count } });
    }

    if (operation === 'assign') {
        const userId = ctx.getNodeParameter('userId', i) as string;
        const tagName = ctx.getNodeParameter('tagName', i) as string;
        const tagId = ctx.getNodeParameter('tagId', i) as string;
        const body: IDataObject = { user_id: userId };
        if (tagName) body.tag_name = tagName;
        else if (tagId) body.tag_id = tagId;
        else throw new NodeOperationError(ctx.getNode(), 'Provide either Tag Name or Tag ID');
        return zaloRequest(ctx, { url: '/tag/taguser', method: 'POST', body });
    }

    if (operation === 'remove') {
        const tagName = ctx.getNodeParameter('tagName', i) as string;
        const tagId = ctx.getNodeParameter('tagId', i) as string;
        const body: IDataObject = {};
        if (tagName) body.tag_name = tagName;
        else if (tagId) body.tag_id = tagId;
        else throw new NodeOperationError(ctx.getNode(), 'Provide either Tag Name or Tag ID');
        return zaloRequest(ctx, { url: '/tag/rmtag', method: 'POST', body });
    }

    if (operation === 'removeFollower') {
        const userId = ctx.getNodeParameter('userId', i) as string;
        const tagName = ctx.getNodeParameter('tagName', i) as string;
        return zaloRequest(ctx, {
            url: '/tag/rmfollowerfromtag',
            method: 'POST',
            body: { user_id: userId, tag_name: tagName },
        });
    }

    throw new NodeOperationError(ctx.getNode(), `Unknown tag operation: ${operation}`);
}

// ─── MENU ────────────────────────────────────────────────────────────────────

async function handleMenu(ctx: IExecuteFunctions, i: number): Promise<IDataObject> {
    const menuItemsCollection = ctx.getNodeParameter('menuItems.values', i, []) as Array<{
        title: string;
        actionType: string;
        payload: string;
    }>;

    const buttons = menuItemsCollection.map((item) => {
        const payloadValue =
            item.actionType === 'oa.open.url' || item.actionType === 'oa.open.phone'
                ? { url: item.payload }
                : item.payload;
        return {
            title: item.title,
            type: item.actionType,
            payload: payloadValue,
        };
    });

    return zaloRequest(ctx, {
        url: '/menu',
        method: 'POST',
        body: { buttons },
    });
}

// ─── ARTICLE ─────────────────────────────────────────────────────────────────

async function handleArticle(ctx: IExecuteFunctions, i: number, operation: string): Promise<IDataObject> {
    if (operation === 'getList') {
        const offset = ctx.getNodeParameter('offset', i) as number;
        const limit = ctx.getNodeParameter('limit', i) as number;
        const type = ctx.getNodeParameter('articleType', i) as number;
        return zaloRequest(ctx, {
            url: '/article/getslice',
            method: 'GET',
            qs: { offset, limit: Math.min(limit, 50), type },
        }, ZALO_OA_V2_BASE);
    }

    if (operation === 'getDetail') {
        const token = ctx.getNodeParameter('articleToken', i) as string;
        return zaloRequest(ctx, { url: '/article/getdetail', method: 'GET', qs: { token } });
    }

    const buildArticleBody = (): IDataObject => {
        const body: IDataObject = {
            title: ctx.getNodeParameter('articleTitle', i) as string,
        };
        const author = ctx.getNodeParameter('articleAuthor', i) as string;
        const coverUrl = ctx.getNodeParameter('articleCoverUrl', i) as string;
        const description = ctx.getNodeParameter('articleDescription', i) as string;
        const articleBody = ctx.getNodeParameter('articleBody', i) as string;
        if (author) body.author = author;
        if (coverUrl) body.cover = { photo_url: coverUrl };
        if (description) body.description = description;
        if (articleBody) body.body = [{ type: 'text', content: articleBody }];
        return body;
    };

    if (operation === 'create') {
        return zaloRequest(ctx, { url: '/article/create', method: 'POST', body: buildArticleBody() });
    }

    if (operation === 'update') {
        const token = ctx.getNodeParameter('articleToken', i) as string;
        return zaloRequest(ctx, { url: '/article/update', method: 'POST', body: { token, ...buildArticleBody() } });
    }

    if (operation === 'remove') {
        const token = ctx.getNodeParameter('articleToken', i) as string;
        return zaloRequest(ctx, { url: '/article/remove', method: 'POST', body: { token } });
    }

    throw new NodeOperationError(ctx.getNode(), `Unknown article operation: ${operation}`);
}

// ─── STORE ───────────────────────────────────────────────────────────────────

async function handleStore(ctx: IExecuteFunctions, i: number, operation: string): Promise<IDataObject> {
    if (operation === 'getProduct') {
        const productId = ctx.getNodeParameter('productId', i) as string;
        return zaloRequest(ctx, {
            url: '/store/product/getproduct',
            method: 'GET',
            qs: { data: encodeDataParam({ product_id: productId }) },
        });
    }

    if (operation === 'getProducts') {
        const offset = ctx.getNodeParameter('offset', i) as number;
        const count = ctx.getNodeParameter('count', i) as number;
        return zaloRequest(ctx, {
            url: '/store/product/getproductofoa',
            method: 'GET',
            qs: { data: encodeDataParam({ offset, count }) },
        });
    }

    if (operation === 'createProduct') {
        const name = ctx.getNodeParameter('productName', i) as string;
        const description = ctx.getNodeParameter('productDescription', i) as string;
        const code = ctx.getNodeParameter('productCode', i) as string;
        const price = ctx.getNodeParameter('productPrice', i) as number;
        const status = ctx.getNodeParameter('productStatus', i) as number;
        const photoUrls = (ctx.getNodeParameter('productPhotos', i) as string)
            .split(',')
            .map((u) => u.trim())
            .filter(Boolean);

        return zaloRequest(ctx, {
            url: '/store/product/create',
            method: 'POST',
            body: {
                name,
                description,
                code,
                price,
                status,
                photos: photoUrls.map((url) => ({ photo_url: url })),
            },
        });
    }

    if (operation === 'updateProduct') {
        const productId = ctx.getNodeParameter('productId', i) as string;
        const description = ctx.getNodeParameter('productDescription', i) as string;
        const code = ctx.getNodeParameter('productCode', i) as string;
        const price = ctx.getNodeParameter('productPrice', i) as number;
        const status = ctx.getNodeParameter('productStatus', i) as number;
        const photoUrls = (ctx.getNodeParameter('productPhotos', i) as string)
            .split(',')
            .map((u) => u.trim())
            .filter(Boolean);

        return zaloRequest(ctx, {
            url: '/store/product/update',
            method: 'POST',
            body: {
                product_id: productId,
                description,
                code,
                price,
                status,
                photos: photoUrls.map((url) => ({ photo_url: url })),
            },
        });
    }

    if (operation === 'createCategory') {
        const name = ctx.getNodeParameter('categoryName', i) as string;
        return zaloRequest(ctx, { url: '/store/category/create', method: 'POST', body: { name } });
    }

    if (operation === 'updateCategory') {
        const categoryId = ctx.getNodeParameter('categoryId', i) as string;
        const name = ctx.getNodeParameter('categoryName', i) as string;
        return zaloRequest(ctx, { url: '/store/category/update', method: 'POST', body: { category_id: categoryId, name } });
    }

    if (operation === 'getCategories') {
        const offset = ctx.getNodeParameter('offset', i) as number;
        const count = ctx.getNodeParameter('count', i) as number;
        return zaloRequest(ctx, {
            url: '/store/category/getcategoryofoa',
            method: 'GET',
            qs: { data: encodeDataParam({ offset, count }) },
        });
    }

    if (operation === 'createOrder') {
        const orderId = ctx.getNodeParameter('orderId', i) as string;
        const userId = ctx.getNodeParameter('userId', i) as string;
        const orderItemsCollection = ctx.getNodeParameter('orderItems.values', i, []) as Array<{
            itemId: string;
            itemName: string;
            price: number;
            quantity: number;
            imageUrl: string;
        }>;

        const items = orderItemsCollection.map((item) => ({
            item_id: item.itemId,
            item_name: item.itemName,
            price: item.price,
            quantity: item.quantity,
            photo_url: item.imageUrl,
        }));

        return zaloRequest(ctx, {
            url: '/store/order/create',
            method: 'POST',
            body: { order_id: orderId, user_id: userId, items },
        });
    }

    throw new NodeOperationError(ctx.getNode(), `Unknown store operation: ${operation}`);
}

// ─── CONVERSATION ─────────────────────────────────────────────────────────────

async function handleConversation(ctx: IExecuteFunctions, i: number, operation: string): Promise<IDataObject> {
    const offset = ctx.getNodeParameter('offset', i) as number;
    const count = ctx.getNodeParameter('count', i) as number;

    if (operation === 'getRecentChats') {
        return zaloRequest(ctx, {
            url: '/listrecentchat',
            method: 'GET',
            qs: { data: encodeDataParam({ offset, count }) },
        }, ZALO_OA_V2_BASE);
    }

    if (operation === 'getMessages') {
        const userId = ctx.getNodeParameter('userId', i) as string;
        return zaloRequest(ctx, {
            url: '/conversation',
            method: 'GET',
            qs: { data: encodeDataParam({ user_id: userId, offset, count }) },
        }, ZALO_OA_V2_BASE);
    }

    throw new NodeOperationError(ctx.getNode(), `Unknown conversation operation: ${operation}`);
}
