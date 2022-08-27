import { S3 } from "@aws-sdk/client-s3";
import { ApiException } from "@models/exception.model";

export const PRE_SIGNED_URL_EXPIRY: number = 60 * 10; // 10 minutes

export const validateUserBucket = async (s3: S3) => {
    console.info(`Validating bucket ${process.env.S3_BUCKET_USER} exists`);
    if (!(await checkUserBucketExists(s3))) {
        console.error(`Bucket not found for name: ${process.env.S3_BUCKET_USER}`);
        throw new ApiException(`Destination bucket ${process.env.S3_BUCKET_USER} doesn't exist for region ${process.env.AWS_REGION}`);
    }
};

export const checkUserBucketExists = async (s3: S3) => {
    try {
        await s3.headBucket({Bucket: process.env.S3_BUCKET_USER});
        return true;
    } catch (error) {
        console.error(error)
        return false;
    }
};
