import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { S3ClientConfig } from "@aws-sdk/client-s3";

export const dynamodbClient = (): DynamoDB => {
    if (["dev", "test"].includes(process.env.SYS_ENV)) {
        console.info("Setting up DynamoDB client for env: " + process.env.SYS_ENV);
        return new DynamoDB(
            {
                region: process.env.AWS_REGION,
                credentials: {
                    accessKeyId: "DEFAULT_ACCESS_KEY",
                    secretAccessKey: "DEFAULT_SECRET"
                },
                endpoint: "http://localhost:8002/shell",
            } as S3ClientConfig
        );
    }
    return new DynamoDB({region: process.env.AWS_REGION});
};
