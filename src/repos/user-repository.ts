import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { dynamodbClient } from "@clients/dynamodb-client";
import { dynamoDbDocClient } from "@libs/dynamodb-utils";
import { getItem, putItem, query, updateItem } from "@libs/repository-utils";
import { handleRepoError } from "@libs/utils";
import { UserEntity } from "@repos/user-entity";

export class UserRepository {

    constructor(private readonly dynamodbDocClient: DynamoDBDocumentClient = dynamoDbDocClient(dynamodbClient())) {
    }

    public existsByEmail = async (email: string): Promise<boolean> => {
        console.info(`Get UserEntity by email ${email}`);
        const params = {
            FilterExpression: "email = :email AND deleted = :deleted AND locked = :locked",
            ExpressionAttributeValues: {
                ":email": email,
                ":deleted": false,
                ":locked": false
            },
            TableName: process.env.USER_TABLE
        };
        return query<UserEntity>(this.dynamodbDocClient, params)
            .then(data => data.Items && data.Items.length > 0)
            .catch(error => handleRepoError(error));
    };

    public create = async (userEntity: UserEntity): Promise<UserEntity | null> => {
        console.info(`Create new UserEntity ${JSON.stringify(userEntity)}`);
        const params = {
            TableName: process.env.USER_TABLE,
            Item: userEntity
        };
        return putItem<UserEntity>(this.dynamodbDocClient, params)
            .then(_ => this.getByUserId(userEntity.userId))
            .catch(error => handleRepoError(error));
    };

    public update = async (userEntity: UserEntity): Promise<UserEntity | null> => {
        console.info(`Update UserEntity ${JSON.stringify(userEntity)}`);
        const params = {
            TableName: process.env.USER_TABLE,
            Key: {
                "userId": userEntity.userId
            },
            UpdateExpression: "set firstName = :firstName, lastName = :lastName, idpUserName = :idpUserName, idpStatus = :idpStatus",
            ExpressionAttributeValues: {
                ":firstName": userEntity.firstName,
                ":lastName": userEntity.lastName,
                ":idpUserName": userEntity.idpUserName,
                ":idpStatus": userEntity.idpStatus,
            },
            ReturnValues: "ALL_NEW"
        };
        return updateItem<UserEntity>(this.dynamodbDocClient, params)
            .then(_ => this.getByUserId(userEntity.userId))
            .catch(error => handleRepoError(error));
    };

    public updateWithLock = async (userEntity: UserEntity): Promise<UserEntity | null> => {
        console.info(`Update idp details ${JSON.stringify(userEntity)}`);
        const params = {
            TableName: process.env.USER_TABLE,
            Key: {
                "userId": userEntity.userId
            },
            UpdateExpression: "SET idpUserName = :idpUserName, idpStatus = :idpStatus, locked = :locked",
            ExpressionAttributeValues: {
                ":idpUserName": userEntity.idpUserName,
                ":idpStatus": userEntity.idpStatus,
                ":locked": userEntity.locked
            },
            ReturnValues: "ALL_NEW"
        };
        return updateItem<UserEntity>(this.dynamodbDocClient, params)
            .then(_ => this.getByUserId(userEntity.userId))
            .catch(error => handleRepoError(error));
    };

    public getByIdpUserName = async (idpUserName: string): Promise<UserEntity | null> => {
        console.info(`Get UserEntity by idpUserName ${idpUserName}`);
        const params = {
            FilterExpression: "idpUserName = :idpUserName AND deleted = :deleted",
            ExpressionAttributeValues: {
                ":idpUserName": idpUserName,
                ":deleted": false
            },
            TableName: process.env.USER_TABLE
        };
        return query<UserEntity | null>(this.dynamodbDocClient, params)
            .then(data => data.Items.length > 0 ? data.Items[0] : null)
            .catch(error => handleRepoError(error));
    };

    public getByEmail = async (email: string): Promise<UserEntity | null> => {
        console.info(`Get UserEntity by email ${email}`);
        const params = {
            FilterExpression: "email = :email AND deleted = :deleted",
            ExpressionAttributeValues: {
                ":email": email,
                ":deleted": false
            },
            TableName: process.env.USER_TABLE
        };
        return query<UserEntity>(this.dynamodbDocClient, params)
            .then(data => data.Items.length > 0 ? data.Items[0] : null)
            .catch(error => handleRepoError(error));
    };

    public getByUserId = async (userId: string): Promise<UserEntity | null> => {
        console.info(`Get UserEntity by userId ${userId}`);
        const params = {
            Key: {userId},
            TableName: process.env.USER_TABLE
        };
        return getItem<UserEntity>(this.dynamodbDocClient, params)
            .then(data => !!data.Item ? data.Item : null)
            .catch(error => handleRepoError(error));
    };

}
