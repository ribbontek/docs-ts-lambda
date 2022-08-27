/* tslint:disable */
export const resources = {
    UsersTable: {
        Type: "AWS::DynamoDB::Table",
        DeletionPolicy: "Retain",
        Properties: {
            TableName: "${self:provider.environment.USER_TABLE}",
            AttributeDefinitions: [
                {AttributeName: "userId", AttributeType: "S"}
            ],
            KeySchema: [
                {AttributeName: "userId", KeyType: "HASH"},
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: "${self:custom.table_throughput}",
                WriteCapacityUnits: "${self:custom.table_throughput}"
            }
        }
    },
    FilesTable: {
        Type: "AWS::DynamoDB::Table",
        DeletionPolicy: "Retain",
        Properties: {
            TableName: "${self:provider.environment.FILE_TABLE}",
            AttributeDefinitions: [
                {AttributeName: "fileId", AttributeType: "S"},
                {AttributeName: "userId", AttributeType: "S"}
            ],
            KeySchema: [
                {AttributeName: "fileId", KeyType: "HASH"},
                {AttributeName: "userId", KeyType: "RANGE"},
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: "${self:custom.table_throughput}",
                WriteCapacityUnits: "${self:custom.table_throughput}"
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'user_index',
                    KeySchema: [
                        { AttributeName: 'userId', KeyType: 'HASH' },
                    ],
                    Projection: { // attributes to project into the index
                        ProjectionType: 'ALL' // (ALL | KEYS_ONLY | INCLUDE)
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: '${self:custom.table_throughput}',
                        WriteCapacityUnits: '${self:custom.table_throughput}'
                    },
                }
            ]
        }
    },
    PostsTable: {
        Type: "AWS::DynamoDB::Table",
        DeletionPolicy: "Retain",
        Properties: {
            TableName: "${self:provider.environment.POST_TABLE}",
            AttributeDefinitions: [
                {AttributeName: "postId", AttributeType: "S"},
                {AttributeName: "userId", AttributeType: "S"}
            ],
            KeySchema: [
                {AttributeName: "postId", KeyType: "HASH"},
                {AttributeName: "userId", KeyType: "RANGE"},
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: "${self:custom.table_throughput}",
                WriteCapacityUnits: "${self:custom.table_throughput}"
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'user_index',
                    KeySchema: [
                        { AttributeName: 'userId', KeyType: 'HASH' },
                    ],
                    Projection: { // attributes to project into the index
                        ProjectionType: 'ALL' // (ALL | KEYS_ONLY | INCLUDE)
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: '${self:custom.table_throughput}',
                        WriteCapacityUnits: '${self:custom.table_throughput}'
                    },
                }
            ]
        }
    },
    UserBucket: {
        Type: "AWS::S3::Bucket",
        DeletionPolicy: "Retain",
        Properties: {
            BucketName: "${self:provider.environment.S3_BUCKET_USER}",
            BucketEncryption: {
                ServerSideEncryptionConfiguration: [{
                    ServerSideEncryptionByDefault: {
                        SSEAlgorithm: "AES256"
                    }
                }]
            },
            CorsConfiguration: {
                CorsRules: [{
                    AllowedHeaders: ["*"],
                    AllowedMethods: ["GET", "PUT"],
                    AllowedOrigins: ["*"],
                    Id: "CORSRuleId1",
                    MaxAge: "3600"
                }]
            }
        }
    },
    CompressedBucket: {
        Type: "AWS::S3::Bucket",
        DeletionPolicy: "Retain",
        Properties: {
            BucketName: "${self:provider.environment.S3_BUCKET_COMPRESSED}",
            BucketEncryption: {
                ServerSideEncryptionConfiguration: [{
                    ServerSideEncryptionByDefault: {
                        SSEAlgorithm: "AES256"
                    }
                }]
            },
            CorsConfiguration: {
                CorsRules: [{
                    AllowedHeaders: ["*"],
                    AllowedMethods: ["GET", "PUT"],
                    AllowedOrigins: ["*"],
                    Id: "CORSRuleId1",
                    MaxAge: "3600"
                }]
            }
        }
    },
    AnalyzedBucket: {
        Type: "AWS::S3::Bucket",
        DeletionPolicy: "Retain",
        Properties: {
            BucketName: "${self:provider.environment.S3_BUCKET_ANALYZED}",
            BucketEncryption: {
                ServerSideEncryptionConfiguration: [{
                    ServerSideEncryptionByDefault: {
                        SSEAlgorithm: "AES256"
                    }
                }]
            },
            CorsConfiguration: {
                CorsRules: [{
                    AllowedHeaders: ["*"],
                    AllowedMethods: ["GET", "PUT"],
                    AllowedOrigins: ["*"],
                    Id: "CORSRuleId1",
                    MaxAge: "3600"
                }]
            }
        }
    }
};
