import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@clients/s3-client";
import { PRE_SIGNED_URL_EXPIRY, validateUserBucket } from "@libs/s3-utils";
import { handleApiError, validateSupportedFileTypes } from "@libs/utils";
import { mapCreateFileCommandToEntity, mapToCreateFileResponse } from "@mappers/file.mapper";
import { AlreadyExistsException, BadRequestException } from "@models/exception.model";
import { CreateFileCommand, CreateFileResponse } from "@models/file.model";
import { FileEntity } from "@repos/file-entity";
import { FileRepository } from "@repos/file-repository";

export class CreateFileService {

    constructor(
        private readonly s3 = s3Client(),
        private readonly fileRepository = new FileRepository()
    ) {
    }

    public create = async (cmd: CreateFileCommand): Promise<CreateFileResponse> => {
        await validateUserBucket(this.s3);
        await this.validateCreateFileCommand(cmd);
        return this.fileRepository.createFile(mapCreateFileCommandToEntity(cmd))
            .then(async (entity: FileEntity) => mapToCreateFileResponse(entity, await this.createPreSignedUrl(entity)))
            .catch(error => handleApiError(error));
    };

    private readonly validateCreateFileCommand = async (cmd: CreateFileCommand) => {
        console.info(`Validating unique file name for ${cmd.name}`);
        if (await this.fileRepository.existsByNameAndUserId(cmd.name, cmd.userId)) {
            throw new AlreadyExistsException(`File found with same name: ${cmd.name}`);
        }
        console.info(`Validating file type`)
        if (!await validateSupportedFileTypes(cmd.name)) {
            throw new BadRequestException(`File type not supported for file name: ${cmd.name}`)
        }
    };

    private readonly createPreSignedUrl = async (entity: FileEntity): Promise<string> => {
        const bucketParams = {
            Bucket: process.env.S3_BUCKET_USER,
            Key: `user/${entity.userId}/${entity.name}`
        };
        return getSignedUrl(this.s3, new PutObjectCommand(bucketParams), {expiresIn: PRE_SIGNED_URL_EXPIRY});
    };

}
