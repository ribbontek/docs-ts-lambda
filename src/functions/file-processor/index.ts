import { handlerPath } from "@libs/handler-resolver";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            s3: {
                bucket: "${self:provider.environment.S3_BUCKET_USER}",
                event: "s3:ObjectCreated:*",
                existing: true
            }
        }
    ],
    memorySize: 2048,
    ephemeralStorageSize: 2048,
    timeout: 900,
    package: {
        include: ["./third-party"]
    }
};

