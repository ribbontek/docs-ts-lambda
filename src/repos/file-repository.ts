import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { dynamodbClient } from "@clients/dynamodb-client";
import { dynamoDbDocClient } from "@libs/dynamodb-utils";
import { getItem, putItem, query, updateItem } from "@libs/repository-utils";
import { handleRepoError } from "@libs/utils";
import { TextractBlock } from "@models/file.model";
import { FileEntity } from "@repos/file-entity";

export class FileRepository {

    constructor(private readonly dynamodbDocClient: DynamoDBDocumentClient = dynamoDbDocClient(dynamodbClient())) {
    }

    public existsByNameAndUserId = async (name: string, userId: string): Promise<boolean> => {
        console.info(`Exists FileEntity by name ${name} for user ${userId}`);
        const params = {
            IndexName: "user_index",
            FilterExpression: "userId = :userId AND #name = :name AND deleted = :deleted",
            ExpressionAttributeValues: {
                ":userId": userId,
                ":name": name,
                ":deleted": false
            },
            ExpressionAttributeNames: {
                "#name": "name"
            },
            TableName: process.env.FILE_TABLE
        };
        return query(this.dynamodbDocClient, params)
            .then(data => data.Items && data.Items.length > 0)
            .catch(error => handleRepoError(error));
    };

    public getByNameAndUserId = async (name: string, userId: string): Promise<FileEntity | null> => {
        console.info(`Get FileEntity by name ${name} for user ${userId}`);
        const params = {
            IndexName: "user_index",
            FilterExpression: "userId = :userId AND #name = :name AND deleted = :deleted",
            ExpressionAttributeValues: {
                ":userId": userId,
                ":name": name,
                ":deleted": false
            },
            ExpressionAttributeNames: {
                "#name": "name"
            },
            TableName: process.env.FILE_TABLE
        };
        return query<FileEntity | null>(this.dynamodbDocClient, params)
            .then(data => !!data.Items && data.Items.length > 0 ? data.Items[0] : null)
            .catch(error => handleRepoError(error));
    };

    public createFile = async (fileEntity: FileEntity): Promise<FileEntity> => {
        console.info(`Create new FileEntity ${JSON.stringify(fileEntity)}`);
        const params = {
            TableName: process.env.FILE_TABLE,
            Item: fileEntity
        };
        return putItem<FileEntity>(this.dynamodbDocClient, params)
            .then(_ => this.getFile(fileEntity.fileId, fileEntity.userId))
            .catch(error => handleRepoError(error));
    };

    public updateFileAsCompressed = async (fileEntity: FileEntity): Promise<FileEntity> => {
        console.info(`Updating FileEntity ${JSON.stringify(fileEntity)}`);
        const params = {
            TableName: process.env.FILE_TABLE,
            Key: {
                "fileId": fileEntity.fileId,
                "userId": fileEntity.userId
            },
            UpdateExpression: "SET size = :size, compressed = :compressed, metadata = :metadata",
            ExpressionAttributeValues: {
                ":size": fileEntity.size,
                ":compressed": fileEntity.compressed,
                ":metadata": fileEntity.metadata
            },
            ReturnValues: "ALL_NEW"
        };
        return updateItem<FileEntity>(this.dynamodbDocClient, params)
            .then(_ => this.getFile(fileEntity.fileId, fileEntity.userId))
            .catch(error => handleRepoError(error));
    };

    public markFileAsUploaded = async (fileId: string, userId: string): Promise<FileEntity> => {
        console.info(`Mark FileEntity As Uploaded for fileId: ${fileId} and userId: ${userId}`);
        const params = {
            TableName: process.env.FILE_TABLE,
            Key: {
                "fileId": fileId,
                "userId": userId
            },
            UpdateExpression: "SET uploaded = :uploaded",
            ExpressionAttributeValues: {":uploaded": true},
            ReturnValues: "ALL_NEW"
        };
        return updateItem<FileEntity>(this.dynamodbDocClient, params)
            .then(_ => this.getFile(fileId, userId))
            .catch(error => handleRepoError(error));
    };

    public saveAnalyzedResults = async (fileId: string, userId: string, blocks: TextractBlock[]): Promise<FileEntity> => {
        console.info(`Mark FileEntity As Analyzed for fileId: ${fileId} and userId: ${userId}`);
        const params = {
            TableName: process.env.FILE_TABLE,
            Key: {
                "fileId": fileId,
                "userId": userId
            },
            UpdateExpression: "SET analyzed = :analyzed, blocks = :blocks, tags = :tags",
            ExpressionAttributeValues: {
                ":analyzed": true,
                ":blocks": blocks,
                ":tags": blocks.filter(e => e.blockType == "WORD").map(e => e.text)
            },
            ReturnValues: "ALL_NEW"
        };
        return updateItem<FileEntity>(this.dynamodbDocClient, params)
            .then(_ => this.getFile(fileId, userId))
            .catch(error => handleRepoError(error));
    };

    public getFile = async (fileId: string, userId: string): Promise<FileEntity | null> => {
        console.info(`Get FileEntity by fileId ${fileId} and userId ${userId}`);
        const params = {
            Key: {
                fileId,
                userId,
            },
            TableName: process.env.FILE_TABLE
        };
        return getItem<FileEntity | null>(this.dynamodbDocClient, params)
            .then(data => data.Item)
            .catch(error => handleRepoError(error));
    };

    public deleteFile = async (fileId: string, userId: string): Promise<void> => {
        console.info(`Delete FileEntity by fileId ${fileId} and userId ${userId}`);
        const params = {
            TableName: process.env.FILE_TABLE,
            Key: {
                fileId,
                userId
            },
            UpdateExpression: "set deleted = :deleted",
            ExpressionAttributeValues: {
                ":deleted": true
            },
            ReturnValues: "ALL_NEW"
        };
        return updateItem(this.dynamodbDocClient, params)
            .then(_ => Promise.resolve())
            .catch(error => handleRepoError(error));
    };
}
