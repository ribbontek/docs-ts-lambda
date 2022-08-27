import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { dynamodbClient } from "@clients/dynamodb-client";
import { dynamoDbDocClient } from "@libs/dynamodb-utils";
import { count, putItem, query, updateItem } from "@libs/repository-utils";
import { handleRepoError } from "@libs/utils";
import { SearchPostCommand } from "@models/post.model";
import { PagedEntity } from "@repos/paged-entity";
import { PostEntity, PrivacyEnum } from "@repos/post-entity";

export class PostRepository {
    
    constructor(private readonly dynamodbDocClient: DynamoDBDocumentClient = dynamoDbDocClient(dynamodbClient())) {
    }

    public createPost = async (postEntity: PostEntity): Promise<PostEntity> => {
        console.info(`Create new PostEntity ${JSON.stringify(postEntity)}`);
        const params = {
            TableName: process.env.POST_TABLE,
            Item: postEntity
        };
        return putItem<PostEntity>(this.dynamodbDocClient, params)
            .then(_ => this.getPost(postEntity.postId, postEntity.userId))
            .catch(error => handleRepoError(error));
    };

    public updatePost = async (postEntity: PostEntity): Promise<PostEntity> => {
        console.info(`Update PostEntity ${JSON.stringify(postEntity)}`);
        const params = {
            TableName: process.env.POST_TABLE,
            Key: {
                "postId": postEntity.postId,
                "userId": postEntity.userId
            },
            UpdateExpression: "SET message = :message, fileIds = :fileIds, updated = :updated",
            ExpressionAttributeValues: {
                ":message": postEntity.message,
                ":fileIds": postEntity.fileIds,
                ":updated": postEntity.updated
            },
            ReturnValues: "ALL_NEW"
        };
        return updateItem<PostEntity>(this.dynamodbDocClient, params)
            .then(_ => this.getPost(postEntity.postId, postEntity.userId))
            .catch(error => handleRepoError(error));
    };

    public getPost = async (postId: string, userId: string): Promise<PostEntity | null> => {
        console.info(`Get PostEntity by postId ${postId} and userId ${userId}`);
        const params = {
            FilterExpression: "postId = :postId AND userId = :userId AND deleted = :deleted",
            ExpressionAttributeValues: {
                ":postId": postId,
                ":userId": userId,
                ":deleted": false
            },
            TableName: process.env.POST_TABLE
        };
        return query<PostEntity | null>(this.dynamodbDocClient, params)
            .then(data => data.Items.length > 0 ? data.Items[0] : null)
            .catch(error => handleRepoError(error));
    };

    public searchPosts = async (cmd: SearchPostCommand): Promise<PagedEntity<PostEntity> | null> => {
        console.info(`Get Paged PostEntities with cmd ${JSON.stringify(cmd)}`);
        const evaluate = [
            {":message": !!cmd.message ? cmd.message : null},
            {":userId": !!cmd.userId ? cmd.userId : null},
            {":privacy": PrivacyEnum.EVERYONE},
            {":deleted": false}
        ].filter((elements) => Object.values(elements)[0] != null);
        const filterExpressions = [
            !!cmd.message ? "contains(message, :message)" : null,
            !!cmd.userId ? "userId = :userId" : null
        ].filter(data => data != null);
        const orStatement = filterExpressions.length > 0 ? "(" + filterExpressions.join(" OR ") + ") AND " : "";
        const expressionAttributeValues = Object.assign({}, ...evaluate);
        console.info(`Get Paged PostEntities filter expression >>> ${orStatement} privacy = :privacy AND deleted = :deleted`);
        console.info("Get Paged PostEntities expression attributes >>> " + JSON.stringify(expressionAttributeValues));
        const pagedParams = {
            Limit: cmd.limit,
            LastEvaluatedKey: cmd.lastEvaluatedKey,
            FilterExpression: orStatement + "privacy = :privacy AND deleted = :deleted",
            ExpressionAttributeValues: expressionAttributeValues,
            TableName: process.env.POST_TABLE
        };
        const returnedCount = await count(this.dynamodbDocClient, {
            TableName: process.env.POST_TABLE,
            FilterExpression: orStatement + "privacy = :privacy AND deleted = :deleted",
            ExpressionAttributeValues: expressionAttributeValues,
        }).catch(error => handleRepoError(error));
        return query<PostEntity | null>(this.dynamodbDocClient, pagedParams)
            .then(data => {
                      console.info(`Received ${JSON.stringify(data)}`);
                      return data.Items.length > 0 ? {
                          data: data.Items,
                          lastEvaluatedKey: data.LastEvaluatedKey,
                          size: data.Count,
                          total: returnedCount.Count,
                      } : null;
                  }
            )
            .catch(error => handleRepoError(error));
    };

    public deletePost = async (postId: string, userId: string): Promise<void> => {
        console.info(`Delete PostEntity by postId ${postId} and userId ${userId}`);
        const params = {
            TableName: process.env.POST_TABLE,
            Key: {
                postId,
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
