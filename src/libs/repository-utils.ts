import { DynamoDBDocumentClient, GetCommand, GetCommandInput, GetCommandOutput, PutCommand, PutCommandInput, PutCommandOutput, ScanCommand, ScanCommandInput, ScanCommandOutput, UpdateCommand, UpdateCommandInput, UpdateCommandOutput } from "@aws-sdk/lib-dynamodb";

export const updateItem = async <T>(dynamodbDocClient: DynamoDBDocumentClient, data: UpdateCommandInput) => {
    const command = new UpdateCommand({...data});
    return await dynamodbDocClient.send(command) as Omit<UpdateCommandOutput, "Item"> & { Item: T };
};

export const putItem = async <T>(dynamodbDocClient: DynamoDBDocumentClient, data: PutCommandInput) => {
    const command = new PutCommand({...data});
    return await dynamodbDocClient.send(command) as Omit<PutCommandOutput, "Item"> & { Item: T };
};

export const getItem = async <T>(dynamodbDocClient: DynamoDBDocumentClient, data: GetCommandInput) => {
    const command = new GetCommand({...data});
    return await dynamodbDocClient.send(command) as Omit<GetCommandOutput, "Item"> & { Item: T };
};

export const query = async <T>(dynamodbDocClient: DynamoDBDocumentClient, data: ScanCommandInput) => {
    const command = new ScanCommand({...data});
    return await dynamodbDocClient.send(command) as Omit<ScanCommandOutput, "Items"> & { Items: T[] };
};

export const count = async (dynamodbDocClient: DynamoDBDocumentClient, params: ScanCommandInput): Promise<ScanCommandOutput> => {
    return await dynamodbDocClient.send(new ScanCommand({Select: "COUNT", ...params}));
};


