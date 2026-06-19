import type { INodeProperties } from 'n8n-workflow';

export const resourceOptions: INodeProperties = {
    displayName: 'Resource',
    name: 'resource',
    type: 'options',
    noDataExpression: true,
    options: [
        { name: 'Message', value: 'message', description: 'Send messages to followers' },
        { name: 'Follower', value: 'follower', description: 'Manage OA followers' },
        { name: 'OA Profile', value: 'oa', description: 'Get OA information' },
        { name: 'Media', value: 'media', description: 'Upload images, files and GIFs' },
        { name: 'Tag', value: 'tag', description: 'Manage follower tags' },
        { name: 'Menu', value: 'menu', description: 'Configure OA menu' },
        { name: 'Article', value: 'article', description: 'Create and manage articles' },
        { name: 'Store', value: 'store', description: 'Manage products, categories and orders' },
        { name: 'Conversation', value: 'conversation', description: 'View chat history' },
    ],
    default: 'message',
};

// ─── MESSAGE RESOURCE ────────────────────────────────────────────────────────

const messageTypeField: INodeProperties = {
    displayName: 'Message Type',
    name: 'messageType',
    type: 'options',
    options: [
        {
            name: 'Customer Service (CS)',
            value: 'cs',
            description: 'For customer support conversations — requires user to have messaged OA within 7 days',
        },
        {
            name: 'Transaction',
            value: 'transaction',
            description: 'For transactional updates (order status, account info)',
        },
        {
            name: 'Promotion',
            value: 'promotion',
            description: 'For marketing and promotional content — subject to daily quota',
        },
    ],
    default: 'cs',
    required: true,
    description: 'Zalo OA v3.0 message type — determines delivery rules and quotas',
};

export const messageOperations: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['message'] } },
    options: [
        { name: 'Send Text', value: 'sendText', description: 'Send a plain text message', action: 'Send text message' },
        { name: 'Send Image', value: 'sendImage', description: 'Send an image to a follower', action: 'Send image message' },
        { name: 'Send File', value: 'sendFile', description: 'Send a file attachment', action: 'Send file message' },
        { name: 'Send List', value: 'sendList', description: 'Send a list template message', action: 'Send list message' },
        { name: 'Send Sticker', value: 'sendSticker', description: 'Send a sticker', action: 'Send sticker message' },
        { name: 'Get Status', value: 'getStatus', description: 'Check delivery status of a sent message', action: 'Get message status' },
    ],
    default: 'sendText',
};

export const messageFields: INodeProperties[] = [
    // sendText
    {
        displayName: 'User ID',
        name: 'userId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['message'], operation: ['sendText', 'sendImage', 'sendFile', 'sendList', 'sendSticker'] } },
        description: 'Follower User ID (user_id)',
    },
    { ...messageTypeField, displayOptions: { show: { resource: ['message'], operation: ['sendText', 'sendImage', 'sendFile', 'sendList', 'sendSticker'] } } },
    {
        displayName: 'Text',
        name: 'text',
        type: 'string',
        typeOptions: { rows: 4 },
        required: true,
        default: '',
        displayOptions: { show: { resource: ['message'], operation: ['sendText'] } },
        description: 'Message text content',
    },
    // sendImage
    {
        displayName: 'Image Source',
        name: 'imageSource',
        type: 'options',
        options: [
            { name: 'URL', value: 'url', description: 'Send by image URL' },
            { name: 'Attachment ID', value: 'attachmentId', description: 'Send by previously uploaded attachment_id' },
        ],
        default: 'url',
        displayOptions: { show: { resource: ['message'], operation: ['sendImage'] } },
    },
    {
        displayName: 'Image URL',
        name: 'imageUrl',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['message'], operation: ['sendImage'], imageSource: ['url'] } },
        description: 'Publicly accessible image URL',
    },
    {
        displayName: 'Attachment ID',
        name: 'attachmentId',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['message'], operation: ['sendImage'], imageSource: ['attachmentId'] } },
        description: 'attachment_id returned from upload image operation',
    },
    // sendFile
    {
        displayName: 'File Token',
        name: 'fileToken',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['message'], operation: ['sendFile'] } },
        description: 'Token returned from upload file operation',
    },
    // sendList
    {
        displayName: 'List Title (Button)',
        name: 'listTitle',
        type: 'string',
        required: true,
        default: 'View More',
        displayOptions: { show: { resource: ['message'], operation: ['sendList'] } },
        description: 'Text for the bottom action button of the list',
    },
    {
        displayName: 'Button URL',
        name: 'listButtonUrl',
        type: 'string',
        required: true,
        default: 'https://zalo.me',
        displayOptions: { show: { resource: ['message'], operation: ['sendList'] } },
        description: 'URL the bottom button links to',
    },
    {
        displayName: 'Elements',
        name: 'elements',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true, minValue: 1, maxValue: 4 },
        displayOptions: { show: { resource: ['message'], operation: ['sendList'] } },
        default: {},
        description: 'List items (1–4 elements)',
        options: [
            {
                name: 'values',
                displayName: 'Element',
                values: [
                    { displayName: 'Title', name: 'title', type: 'string', default: '', description: 'Element title' },
                    { displayName: 'Subtitle', name: 'subtitle', type: 'string', default: '', description: 'Element subtitle' },
                    { displayName: 'Image URL', name: 'imageUrl', type: 'string', default: '', description: 'Element thumbnail image URL' },
                    { displayName: 'Action URL', name: 'actionUrl', type: 'string', default: 'https://zalo.me', description: 'URL when element is tapped' },
                ],
            },
        ],
    },
    // sendSticker
    {
        displayName: 'Sticker ID',
        name: 'stickerId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['message'], operation: ['sendSticker'] } },
        description: 'Sticker ID from Zalo OA sticker library',
    },
    // getStatus
    {
        displayName: 'Message ID',
        name: 'messageId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['message'], operation: ['getStatus'] } },
        description: 'msg_id returned when the message was sent',
    },
];

// ─── FOLLOWER RESOURCE ───────────────────────────────────────────────────────

export const followerOperations: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['follower'] } },
    options: [
        { name: 'Get Info', value: 'getInfo', description: 'Get detailed info of a follower', action: 'Get follower info' },
        { name: 'Get List', value: 'getList', description: 'List all followers', action: 'Get follower list' },
        { name: 'Update', value: 'update', description: "Update a follower's display name and notes", action: 'Update follower' },
    ],
    default: 'getInfo',
};

export const followerFields: INodeProperties[] = [
    {
        displayName: 'User ID',
        name: 'userId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['follower'], operation: ['getInfo', 'update'] } },
        description: 'Follower User ID',
    },
    {
        displayName: 'Offset',
        name: 'offset',
        type: 'number',
        default: 0,
        displayOptions: { show: { resource: ['follower'], operation: ['getList'] } },
        description: 'Pagination offset',
    },
    {
        displayName: 'Count',
        name: 'count',
        type: 'number',
        default: 50,
        typeOptions: { maxValue: 50 },
        displayOptions: { show: { resource: ['follower'], operation: ['getList'] } },
        description: 'Number of followers to return (max 50)',
    },
    {
        displayName: 'Display Name',
        name: 'displayName',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['follower'], operation: ['update'] } },
        description: "Custom display name for this follower in the OA inbox",
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['follower'], operation: ['update'] } },
        options: [
            { displayName: 'City', name: 'city', type: 'string', default: '' },
            { displayName: 'District', name: 'district', type: 'string', default: '' },
            { displayName: 'Address', name: 'address', type: 'string', default: '' },
            { displayName: 'Phone', name: 'phone', type: 'string', default: '' },
            { displayName: 'Notes', name: 'notes', type: 'string', default: '' },
        ],
    },
];

// ─── OA PROFILE RESOURCE ─────────────────────────────────────────────────────

export const oaOperations: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['oa'] } },
    options: [
        { name: 'Get Profile', value: 'getProfile', description: 'Get information about this OA', action: 'Get OA profile' },
    ],
    default: 'getProfile',
};

// ─── MEDIA RESOURCE ──────────────────────────────────────────────────────────

export const mediaOperations: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['media'] } },
    options: [
        { name: 'Upload Image', value: 'uploadImage', description: 'Upload an image and get attachment_id', action: 'Upload image' },
        { name: 'Upload File', value: 'uploadFile', description: 'Upload a file and get token', action: 'Upload file' },
        { name: 'Upload GIF', value: 'uploadGif', description: 'Upload a GIF and get attachment_id', action: 'Upload GIF' },
    ],
    default: 'uploadImage',
};

const binarySourceFields = (ops: string[], hint = 'image'): INodeProperties[] => [
    {
        displayName: 'Source',
        name: 'binaryData',
        type: 'options',
        options: [
            { name: 'Binary Data (n8n)', value: true, description: 'Upload from n8n binary data' },
            { name: 'URL', value: false, description: `Upload from a public ${hint} URL` },
        ],
        default: false,
        displayOptions: { show: { resource: ['media'], operation: ops } },
    },
    {
        displayName: 'Binary Property',
        name: 'binaryProperty',
        type: 'string',
        default: 'data',
        displayOptions: { show: { resource: ['media'], operation: ops, binaryData: [true] } },
        description: 'Name of the binary property containing the file',
    },
    {
        displayName: `${hint.charAt(0).toUpperCase() + hint.slice(1)} URL`,
        name: 'mediaUrl',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['media'], operation: ops, binaryData: [false] } },
        description: `Publicly accessible ${hint} URL`,
    },
];

export const mediaFields: INodeProperties[] = [
    ...binarySourceFields(['uploadImage'], 'image'),
    ...binarySourceFields(['uploadFile'], 'file'),
    ...binarySourceFields(['uploadGif'], 'GIF'),
];

// ─── TAG RESOURCE ────────────────────────────────────────────────────────────

export const tagOperations: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['tag'] } },
    options: [
        { name: 'Get List', value: 'getList', description: 'List all tags for this OA', action: 'Get tag list' },
        { name: 'Assign to Follower', value: 'assign', description: 'Assign a tag to a follower', action: 'Assign tag' },
        { name: 'Remove Tag', value: 'remove', description: 'Delete a tag from this OA', action: 'Remove tag' },
        { name: 'Remove Follower from Tag', value: 'removeFollower', description: 'Remove a follower from a tag', action: 'Remove follower from tag' },
    ],
    default: 'getList',
};

export const tagFields: INodeProperties[] = [
    {
        displayName: 'Offset',
        name: 'offset',
        type: 'number',
        default: 0,
        displayOptions: { show: { resource: ['tag'], operation: ['getList'] } },
    },
    {
        displayName: 'Count',
        name: 'count',
        type: 'number',
        default: 50,
        displayOptions: { show: { resource: ['tag'], operation: ['getList'] } },
    },
    {
        displayName: 'Tag Name',
        name: 'tagName',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['tag'], operation: ['assign', 'remove', 'removeFollower'] } },
        description: 'Tag name (use either tag name or tag ID)',
    },
    {
        displayName: 'Tag ID',
        name: 'tagId',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['tag'], operation: ['assign', 'remove'] } },
        description: 'Tag ID (use either tag name or tag ID)',
    },
    {
        displayName: 'User ID',
        name: 'userId',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['tag'], operation: ['assign', 'removeFollower'] } },
        description: 'Follower User ID to assign/remove tag',
    },
];

// ─── MENU RESOURCE ───────────────────────────────────────────────────────────

export const menuOperations: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['menu'] } },
    options: [
        { name: 'Update Menu', value: 'update', description: 'Set the OA persistent menu', action: 'Update OA menu' },
    ],
    default: 'update',
};

export const menuFields: INodeProperties[] = [
    {
        displayName: 'Menu Items',
        name: 'menuItems',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true, minValue: 1, maxValue: 5 },
        displayOptions: { show: { resource: ['menu'], operation: ['update'] } },
        default: {},
        description: 'Menu items (up to 5)',
        options: [
            {
                name: 'values',
                displayName: 'Item',
                values: [
                    {
                        displayName: 'Title',
                        name: 'title',
                        type: 'string',
                        default: '',
                        description: 'Menu item display text',
                    },
                    {
                        displayName: 'Action Type',
                        name: 'actionType',
                        type: 'options',
                        options: [
                            { name: 'Open URL', value: 'oa.open.url', description: 'Open a URL in browser' },
                            { name: 'Send Text', value: 'oa.send.message', description: 'Send a predefined text' },
                            { name: 'Open Phone', value: 'oa.open.phone', description: 'Open phone dialer' },
                        ],
                        default: 'oa.open.url',
                    },
                    {
                        displayName: 'Payload (URL / Text / Phone)',
                        name: 'payload',
                        type: 'string',
                        default: '',
                        description: 'URL, message text, or phone number depending on action type',
                    },
                ],
            },
        ],
    },
];

// ─── ARTICLE RESOURCE ────────────────────────────────────────────────────────

export const articleOperations: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['article'] } },
    options: [
        { name: 'Create', value: 'create', description: 'Create a new article', action: 'Create article' },
        { name: 'Update', value: 'update', description: 'Update an existing article', action: 'Update article' },
        { name: 'Remove', value: 'remove', description: 'Delete an article', action: 'Remove article' },
        { name: 'Get List', value: 'getList', description: 'Get a list of articles', action: 'Get article list' },
        { name: 'Get Detail', value: 'getDetail', description: 'Get details of an article', action: 'Get article detail' },
    ],
    default: 'getList',
};

export const articleFields: INodeProperties[] = [
    {
        displayName: 'Token',
        name: 'articleToken',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['article'], operation: ['update', 'remove', 'getDetail'] } },
        description: 'Article token (returned when article was created)',
    },
    {
        displayName: 'Title',
        name: 'articleTitle',
        type: 'string',
        required: true,
        default: '',
        displayOptions: { show: { resource: ['article'], operation: ['create', 'update'] } },
    },
    {
        displayName: 'Author',
        name: 'articleAuthor',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['article'], operation: ['create', 'update'] } },
    },
    {
        displayName: 'Cover URL',
        name: 'articleCoverUrl',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['article'], operation: ['create', 'update'] } },
        description: 'Cover image URL for the article',
    },
    {
        displayName: 'Description',
        name: 'articleDescription',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['article'], operation: ['create', 'update'] } },
    },
    {
        displayName: 'Body (HTML)',
        name: 'articleBody',
        type: 'string',
        typeOptions: { rows: 10 },
        default: '',
        displayOptions: { show: { resource: ['article'], operation: ['create', 'update'] } },
        description: 'Article body in HTML format',
    },
    // getList
    {
        displayName: 'Offset',
        name: 'offset',
        type: 'number',
        default: 0,
        displayOptions: { show: { resource: ['article'], operation: ['getList'] } },
    },
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 10,
        typeOptions: { maxValue: 50 },
        displayOptions: { show: { resource: ['article'], operation: ['getList'] } },
    },
    {
        displayName: 'Type',
        name: 'articleType',
        type: 'options',
        options: [
            { name: 'Normal', value: 1 },
            { name: 'Video', value: 2 },
        ],
        default: 1,
        displayOptions: { show: { resource: ['article'], operation: ['getList'] } },
    },
];

// ─── STORE RESOURCE ──────────────────────────────────────────────────────────

export const storeOperations: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['store'] } },
    options: [
        { name: 'Create Product', value: 'createProduct', action: 'Create product' },
        { name: 'Update Product', value: 'updateProduct', action: 'Update product' },
        { name: 'Get Product', value: 'getProduct', action: 'Get product info' },
        { name: 'Get Products', value: 'getProducts', action: 'List products' },
        { name: 'Create Category', value: 'createCategory', action: 'Create category' },
        { name: 'Update Category', value: 'updateCategory', action: 'Update category' },
        { name: 'Get Categories', value: 'getCategories', action: 'List categories' },
        { name: 'Create Order', value: 'createOrder', action: 'Create order' },
    ],
    default: 'getProducts',
};

export const storeFields: INodeProperties[] = [
    // Product operations
    {
        displayName: 'Product ID',
        name: 'productId',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['store'], operation: ['updateProduct', 'getProduct'] } },
        required: true,
    },
    {
        displayName: 'Product Name',
        name: 'productName',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['store'], operation: ['createProduct'] } },
    },
    {
        displayName: 'Description',
        name: 'productDescription',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['store'], operation: ['createProduct', 'updateProduct'] } },
    },
    {
        displayName: 'Code (SKU)',
        name: 'productCode',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['store'], operation: ['createProduct', 'updateProduct'] } },
    },
    {
        displayName: 'Price',
        name: 'productPrice',
        type: 'number',
        default: 0,
        displayOptions: { show: { resource: ['store'], operation: ['createProduct', 'updateProduct'] } },
        description: 'Price in VND',
    },
    {
        displayName: 'Status',
        name: 'productStatus',
        type: 'options',
        options: [
            { name: 'Available', value: 1 },
            { name: 'Unavailable', value: 0 },
        ],
        default: 1,
        displayOptions: { show: { resource: ['store'], operation: ['createProduct', 'updateProduct'] } },
    },
    {
        displayName: 'Photo URLs',
        name: 'productPhotos',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['store'], operation: ['createProduct', 'updateProduct'] } },
        description: 'Comma-separated list of product photo URLs',
    },
    // Product list
    {
        displayName: 'Offset',
        name: 'offset',
        type: 'number',
        default: 0,
        displayOptions: { show: { resource: ['store'], operation: ['getProducts', 'getCategories'] } },
    },
    {
        displayName: 'Count',
        name: 'count',
        type: 'number',
        default: 10,
        displayOptions: { show: { resource: ['store'], operation: ['getProducts', 'getCategories'] } },
    },
    // Category operations
    {
        displayName: 'Category ID',
        name: 'categoryId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['store'], operation: ['updateCategory'] } },
    },
    {
        displayName: 'Category Name',
        name: 'categoryName',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['store'], operation: ['createCategory', 'updateCategory'] } },
    },
    // Order
    {
        displayName: 'Order ID',
        name: 'orderId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['store'], operation: ['createOrder'] } },
        description: 'Your internal order ID',
    },
    {
        displayName: 'User ID',
        name: 'userId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['store'], operation: ['createOrder'] } },
        description: 'Follower user_id who placed the order',
    },
    {
        displayName: 'Order Items',
        name: 'orderItems',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true, minValue: 1 },
        displayOptions: { show: { resource: ['store'], operation: ['createOrder'] } },
        default: {},
        options: [
            {
                name: 'values',
                displayName: 'Item',
                values: [
                    { displayName: 'Item ID', name: 'itemId', type: 'string', default: '' },
                    { displayName: 'Item Name', name: 'itemName', type: 'string', default: '' },
                    { displayName: 'Price', name: 'price', type: 'number', default: 0 },
                    { displayName: 'Quantity', name: 'quantity', type: 'number', default: 1 },
                    { displayName: 'Image URL', name: 'imageUrl', type: 'string', default: '' },
                ],
            },
        ],
    },
];

// ─── CONVERSATION RESOURCE ───────────────────────────────────────────────────

export const conversationOperations: INodeProperties = {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['conversation'] } },
    options: [
        { name: 'Get Recent Chats', value: 'getRecentChats', description: 'List recent conversations', action: 'Get recent chats' },
        { name: 'Get Messages', value: 'getMessages', description: 'Get messages in a conversation', action: 'Get conversation messages' },
    ],
    default: 'getRecentChats',
};

export const conversationFields: INodeProperties[] = [
    {
        displayName: 'Offset',
        name: 'offset',
        type: 'number',
        default: 0,
        displayOptions: { show: { resource: ['conversation'], operation: ['getRecentChats', 'getMessages'] } },
    },
    {
        displayName: 'Count',
        name: 'count',
        type: 'number',
        default: 10,
        typeOptions: { maxValue: 50 },
        displayOptions: { show: { resource: ['conversation'], operation: ['getRecentChats', 'getMessages'] } },
    },
    {
        displayName: 'User ID',
        name: 'userId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['conversation'], operation: ['getMessages'] } },
        description: 'Follower User ID to get conversation history with',
    },
];

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

export const allOperations: INodeProperties[] = [
    messageOperations,
    followerOperations,
    oaOperations,
    mediaOperations,
    tagOperations,
    menuOperations,
    articleOperations,
    storeOperations,
    conversationOperations,
];

export const allFields: INodeProperties[] = [
    ...messageFields,
    ...followerFields,
    ...mediaFields,
    ...tagFields,
    ...menuFields,
    ...articleFields,
    ...storeFields,
    ...conversationFields,
];
