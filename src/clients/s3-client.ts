import { S3, S3ClientConfig } from "@aws-sdk/client-s3";

export const s3Client = (): S3 => {
    if (["dev", "test"].includes(process.env.SYS_ENV)) {
        console.info("Setting up S3 client for env: " + process.env.SYS_ENV);
        return new S3(
            {
                region: process.env.AWS_REGION,
                forcePathStyle: true,
                credentials: {
                    accessKeyId: "S3RVER", // This specific key is required when working offline
                    secretAccessKey: "S3RVER"
                },
                endpoint: "http://localhost:4569",
            } as S3ClientConfig
        );
    }
    return new S3({region: process.env.AWS_REGION, forcePathStyle: true});
};
