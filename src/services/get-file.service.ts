import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@clients/s3-client";
import { PRE_SIGNED_URL_EXPIRY, validateUserBucket } from "@libs/s3-utils";
import { handleApiError } from "@libs/utils";
import { NotFoundException } from "@models/exception.model";
import { FileMetadata, FileMetadataResponse, GetFileCommand, GetFileResponse, TextractBlock, TextractBlockResponse } from "@models/file.model";
import { FileEntity } from "@repos/file-entity";
import { FileRepository } from "@repos/file-repository";

export class GetFileService {

    constructor(
        private readonly s3 = s3Client(),
        private readonly fileRepository = new FileRepository()
    ) {
    }

    public getFile = async (cmd: GetFileCommand): Promise<GetFileResponse> => {
        await validateUserBucket(this.s3);
        return this.fileRepository.getFile(cmd.fileId, cmd.userId)
            .then(async output => {
                if (!!output) {
                    return this.mapToGetFileResponse(output);
                } else {
                    throw new NotFoundException(`File not found for id: ${cmd.fileId}`);
                }
            })
            .catch(error => handleApiError(error));
    };

    private readonly createPreSignedUrl = async (entity: FileEntity): Promise<string> => {
        const bucketParams = {
            Bucket: process.env.S3_BUCKET_USER,
            Key: `user/${entity.userId}/${entity.name}`
        };
        return getSignedUrl(this.s3, new GetObjectCommand(bucketParams), {expiresIn: PRE_SIGNED_URL_EXPIRY});
    };

    private readonly createPreSignedUrlForAnalyzed = async (entity: FileEntity): Promise<string> => {
        const bucketParams = {
            Bucket: process.env.S3_BUCKET_ANALYZED,
            Key: this.getAnalyzedImageFileName(`user/${entity.userId}/${entity.name}`)
        };
        return getSignedUrl(this.s3, new GetObjectCommand(bucketParams), {expiresIn: PRE_SIGNED_URL_EXPIRY});
    };

    private readonly createPreSignedUrlForCompressed = async (key: string): Promise<string> => {
        const bucketParams = {
            Bucket: process.env.S3_BUCKET_COMPRESSED,
            Key: key
        };
        return getSignedUrl(this.s3, new GetObjectCommand(bucketParams), {expiresIn: PRE_SIGNED_URL_EXPIRY});
    };

    private readonly mapToGetFileResponse = async (entity: FileEntity): Promise<GetFileResponse> => {
        return {
            fileId: entity.fileId,
            name: entity.name,
            preSignedUrl: await this.createPreSignedUrl(entity),
            size: entity.size,
            extension: entity.extension,
            tags: entity.tags,
            uploaded: entity.uploaded,
            analyzed: entity.analyzed,
            compressed: entity.compressed,
            preSignedUrlForAnalyzed: entity.analyzed ? await this.createPreSignedUrlForAnalyzed(entity) : null,
            blocks: this.mapToTextractBlockResponseArray(entity.blocks),
            metadata: await this.mapToFileMetadataResponseArray(entity.metadata)
        };
    };

    private readonly mapToTextractBlockResponseArray = (blocks: TextractBlock[]): TextractBlockResponse[] => {
        return !!blocks ? blocks.map(data => {
            return {
                blockType: data.blockType,
                text: data.text,
                confidence: data.confidence,
                textType: data.textType
            };
        }) : [];
    };

    private readonly mapToFileMetadataResponseArray = async (metadata: FileMetadata[]): Promise<FileMetadataResponse[]> => {
        return !!metadata ? Promise.all(
            metadata.map(async data => {
                             return {
                                 originalHeight: data.originalHeight,
                                 originalWidth: data.originalWidth,
                                 audioCodec: data.audioCodec,
                                 videoCodec: data.videoCodec,
                                 duration: data.duration,
                                 newHeight: data.newHeight,
                                 newWidth: data.newWidth,
                                 newSize: data.newSize,
                                 newName: data.newName,
                                 mimeType: data.mimeType,
                                 preSignedUrl: await this.createPreSignedUrlForCompressed(data.newName),
                             };
                         }
            )
        ) : [];
    };

    private readonly getAnalyzedImageFileName = (key: string): string => {
        const keyArray = key.split(".");
        keyArray.splice(1, 0, "_analyzed.");
        return keyArray.join("");
    };
}
