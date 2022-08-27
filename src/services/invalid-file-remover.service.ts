import { s3Client } from "@clients/s3-client";
import { FileProcessorI } from "@services/file-processor.service";

export class InvalidFileRemoverService implements FileProcessorI {

    constructor(private readonly s3 = s3Client()) {
    }

    public process = async (bucket: string, key: string): Promise<void> => {
        console.error(`Invalid key found ${key} in ${bucket}. Deleting file`);
        await this.s3.deleteObject({Bucket: bucket, Key: key}).catch(error => console.error(error));
    };
}
