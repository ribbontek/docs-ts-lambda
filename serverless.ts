import { functions } from "@functions/index";
import type { AWS } from "@serverless/typescript";
import { resources } from "./resources/resources";

const serverlessConfiguration: AWS = {
    service: "docs-ts-lambda",
    frameworkVersion: "3",
    plugins: [
        "serverless-esbuild",
        "serverless-dynamodb-local",
        "serverless-s3-local",
        "serverless-offline"
    ],
    useDotenv: true,
    provider: {
        name: "aws",
        runtime: "nodejs14.x",
        // @ts-ignore
        region: "${self:custom.region}",
        stage: "${opt:stage, 'dev'}",
        apiGateway: {
            minimumCompressionSize: 1024,
            shouldStartNameWithService: true,
        },
        environment: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
            NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
            USER_TABLE: "${file(./config.${self:provider.stage}.json):userDynamoDbTable, self:custom.user_table}",
            POST_TABLE: "${file(./config.${self:provider.stage}.json):postDynamoDbTable, self:custom.post_table}",
            FILE_TABLE: "${file(./config.${self:provider.stage}.json):fileDynamoDbTable, self:custom.file_table}",
            S3_BUCKET_USER: "${file(./config.${self:provider.stage}.json):userS3Bucket, self:custom.s3.bucket}",
            S3_BUCKET_COMPRESSED: "${file(./config.${self:provider.stage}.json):compressedS3Bucket, self:custom.s3.bucket}",
            S3_BUCKET_ANALYZED: "${file(./config.${self:provider.stage}.json):analyzedS3Bucket, self:custom.s3.bucket}",
            SYS_ENV: "${opt:stage, self:provider.stage, 'dev'}",
            USER_POOL_ID: "${env:USER_POOL_ID}",
            APP_CLIENT_ID: "${env:APP_CLIENT_ID}",
            APP_CLIENT_SECRET: "${env:APP_CLIENT_SECRET}",
            TEST_PASSWORD: "${env:TEST_PASSWORD, null}"
        },
        iamRoleStatements: [
            {
                Effect: "Allow",
                Action: ["dynamodb:*"],
                Resource: {"Fn::GetAtt": ["FilesTable", "Arn"]}
            }, {
                Effect: "Allow",
                Action: ["dynamodb:*"],
                Resource: {"Fn::GetAtt": ["UsersTable", "Arn"]}
            }, {
                Effect: "Allow",
                Action: ["dynamodb:*"],
                Resource: {"Fn::GetAtt": ["PostsTable", "Arn"]}
            }, {
                Effect: "Allow",
                Action: ["s3:*"],
                Resource: "*"
            }, {
                Effect: "Allow",
                Action: ["cloudwatch:*"],
                Resource: "*"
            }, {
                Effect: "Allow",
                Action: ["textract:*"],
                Resource: "*"
            }, {
                Effect: "Allow",
                Action: ["cognito-idp:*"],
                Resource: "*"
            }
        ]
    },
    // import the function via paths
    functions: functions,
    package: {individually: true},
    custom: {
        region: "${opt:region, file(./config.${self:provider.stage}.json):region, 'ap-southeast-2'}",
        stage: "${opt:stage, self:provider.stage}",
        esbuild: {
            bundle: true,
            minify: false,
            sourcemap: true,
            exclude: ["aws-sdk"],
            target: "node14",
            define: {"require.resolve": undefined, 'process.env.FLUENTFFMPEG_COV': '0'},
            platform: "node",
            concurrency: 10,
        },
        dynamodb: {
            stages: ["dev", "test"],
            start: {
                port: 8002,
                inMemory: true,
                heapInitial: "200m",
                heapMax: "1g",
                migrate: true,
                seed: true,
                convertEmptyValues: true,
            }
        },
        s3: {
            bucket: "ribbontek-files",
            stages: ["dev", "test"],
            host: "localhost",
            directory: "/tmp"
        },
        file_table: "ribbontek_files",
        post_table: "ribbontek_posts",
        user_table: "ribbontek_users",
        table_throughputs: {
            prod: 5,
            default: 1,
        },
        table_throughput: "${self:custom.table_throughputs.${self:custom.stage}, self:custom.table_throughputs.default}",
    },
    resources: {
        Resources: resources
    }
};

module.exports = serverlessConfiguration;
