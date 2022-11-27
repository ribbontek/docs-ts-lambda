import { DynamoDB, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";

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
            } as DynamoDBClientConfig
        );
    }
    return new DynamoDB({region: process.env.AWS_REGION});
};
