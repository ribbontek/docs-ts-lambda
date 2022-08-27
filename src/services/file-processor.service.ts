import { s3Client } from "@clients/s3-client";
import { handleApiError } from "@libs/utils";
import { mapProcessFileCompressedResultCommandToEntity } from "@mappers/file.mapper";
import { NotFoundException } from "@models/exception.model";
import { ProcessFileCompressedResult, S3File } from "@models/file.model";
import { FileRepository } from "@repos/file-repository";
import * as fs from "fs";
import * as fsExtra from 'fs-extra'
import { Readable } from "stream";

export abstract class AbstractFileProcessor {

    constructor(
        protected readonly s3 = s3Client(),
        protected readonly fileRepository = new FileRepository()
    ) {
    }

    /**
     * Updates the file entity with the result from the process file command
     * @param cmd
     */
    protected readonly saveToRepository = async (cmd: ProcessFileCompressedResult): Promise<void> => {
        return this.fileRepository.getByNameAndUserId(cmd.name, cmd.userId)
            .then(entity => {
                if (!!entity) {
                    this.fileRepository.updateFileAsCompressed(mapProcessFileCompressedResultCommandToEntity(cmd, entity));
                } else {
                    throw new NotFoundException(`File not found for name ${cmd.name} and user id ${cmd.userId}`);
                }
            })
            .catch(error => handleApiError(error));
    };

    /**
     * Retrieves the file from s3 asynchronously in the S3File model; otherwise null on exceptions
     * @param bucket
     * @param key
     */
    protected readonly retrieveFileAsync = async (bucket: string, key: string): Promise<S3File | null> => {
        return this.s3.getObject({Bucket: bucket, Key: key})
            .then(data => {
                return {key: key, contents: data.Body, length: data.ContentLength};
            })
            .catch(error => {
                console.error(error, `Error getting object for key ${key} in bucket ${bucket}`);
                return null;
            });
    };

    /**
     * Converts a Readable into a Buffer
     * @param stream
     */
    protected readonly streamToBuffer = async (stream: Readable): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on("data", (chunk) => chunks.push(chunk));
            stream.on("error", reject);
            stream.on("end", () => resolve(Buffer.concat(chunks)));
        });
    };

    /**
     * Writes files locally in the tmp directory.
     * @param key
     * @param buffer
     */
    protected readonly writeFileToTmp = (key: string, buffer: Buffer): string => {
        return this.writeFileToFolder(this.tmpFolder(), key, buffer);
    };

    /**
     * Writes files locally in the build directory. Used only for tests / locally
     * @param key
     * @param buffer
     */
    protected readonly writeFileToBuild = (key: string, buffer: Buffer): string => {
        return this.writeFileToFolder("./build", key, buffer);
    };

    /**
     * Writes files in a directory.
     * @param folder
     * @param key
     * @param buffer
     */
    private readonly writeFileToFolder = (folder: string, key: string, buffer: Buffer): string => {
        const dir = this.dirName(key);
        if (!fs.existsSync(`${folder}/${dir}`)) {
            fs.mkdirSync(`${folder}/${dir}`, {recursive: true});
        }
        fs.writeFileSync(`${folder}/${key}`, buffer);
        return `${folder}/${key}`;
    };

    /**
     * Removes files in a directory.
     */
    protected readonly removeTmpFiles = async () => {
        try {
            await fsExtra.emptyDir(this.tmpFolder());
        } catch (e) {
            console.error(e);
        }
    };

    private tmpFolder = (): string => {
        return ["dev", "test"].includes(process.env.SYS_ENV) ? "./tmp" : "/tmp"
    }

    private readonly dirName = (key: string): string => {
        const keys = key.split("/");
        keys.pop();
        return keys.join("/");
    };
}

export interface FileProcessorI {
    process: (bucket: string, key: string) => Promise<void>;
}
