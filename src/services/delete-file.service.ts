import { DeleteObjectCommandOutput } from "@aws-sdk/client-s3";
import { s3Client } from "@clients/s3-client";
import { validateUserBucket } from "@libs/s3-utils";
import { handleApiError } from "@libs/utils";
import { NotFoundException } from "@models/exception.model";
import { DeleteFileCommand } from "@models/file.model";
import { FileEntity } from "@repos/file-entity";
import { FileRepository } from "@repos/file-repository";

export class DeleteFileService {
    constructor(
        private readonly s3 = s3Client(),
        private readonly fileRepository = new FileRepository()
    ) {
    }

    public delete = async (cmd: DeleteFileCommand): Promise<void> => {
        await validateUserBucket(this.s3);
        return this.fileRepository.getFile(cmd.fileId, cmd.userId)
            .then(async (found) => {
                if (!!found) {
                    await this.deleteFileFromS3(found);
                    return this.fileRepository.deleteFile(cmd.fileId, cmd.userId);
                }
                throw new NotFoundException(`File not found for id: ${cmd.fileId}`);
            })
            .catch(error => handleApiError(error));
    };

    /**
     * Deletes the file from S3; returns void on exception if the user hasn't uploaded the file
     * @param entity
     */
    private readonly deleteFileFromS3 = async (entity: FileEntity): Promise<DeleteObjectCommandOutput | void> => {
        const bucketParams = {
            Bucket: process.env.S3_BUCKET_USER,
            Key: `user/${entity.userId}/${entity.name}`
        };
        return this.s3.deleteObject(bucketParams).catch(error => console.error(error));
    };

}
