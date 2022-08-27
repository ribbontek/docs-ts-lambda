import { CreateFileCommand, CreateFileResponse, ProcessFileCompressedResult } from "@models/file.model";
import { FileEntity } from "@repos/file-entity";
import { v4 as uuidv4 } from "uuid";

export const mapCreateFileCommandToEntity = (createFile: CreateFileCommand): FileEntity => {
    return {
        fileId: uuidv4(),
        userId: createFile.userId,
        name: createFile.name,
        size: 0,
        extension: createFile.name.split(".").pop(),
        uploaded: false,
        compressed: false,
        analyzed: false,
        tags: [],
        deleted: false,
        metadata: []
    };
};

export const mapToCreateFileResponse = async (entity: FileEntity, preSignedUrl: string): Promise<CreateFileResponse> => {
    return {
        fileId: entity.fileId,
        name: entity.name,
        preSignedUrl: preSignedUrl
    };
};

export const mapProcessFileCompressedResultCommandToEntity = (cmd: ProcessFileCompressedResult, entity: FileEntity): FileEntity => {
    return {
        fileId: entity.fileId,
        userId: entity.userId,
        name: entity.name,
        size: cmd.size,
        extension: entity.extension,
        uploaded: entity.uploaded,
        compressed: true,
        analyzed: entity.analyzed,
        tags: entity.tags,
        deleted: false,
        metadata: cmd.metadata
    };
};
