import { jimpSupportsMimeType } from "@libs/utils";
import { FileMetadata, ProcessFileCompressedResult, S3File } from "@models/file.model";
import { AbstractFileProcessor, FileProcessorI } from "@services/file-processor.service";
import * as Jimp from "jimp";
import { AUTO } from "jimp";

const getMime = require("name2mime");

export class ImageProcessorService extends AbstractFileProcessor implements FileProcessorI {

    public process = async (bucket: string, key: string): Promise<void> => {
        console.info(`Processing file in bucket ${bucket} with key ${key}`);
        const mimeType = await getMime(key);
        console.info(`Found mime type for file ${mimeType.type}`);
        if (jimpSupportsMimeType(mimeType.type)) {
            console.info("Jimp supports file type");
            return this.retrieveFileAsync(bucket, key)
                .then(file => this.compressImage(key, file, mimeType.type).then(data => this.saveToRepository(this.mapToProcessFileCompressedResult(key, file.length, [data]))))
                .catch(error => console.error(error));
        } else {
            console.error(`Error processing file in bucket ${bucket} with key ${key}`);
            return Promise.resolve();
        }
    };

    private readonly compressImage = async (key: string, file: S3File, mimeType: string): Promise<FileMetadata | null> => {
        console.info(`Retrieved file with length: ${file.length}`);
        let fileMetadata = new FileMetadata();
        let result: Buffer | null = await Jimp.read(await this.streamToBuffer(file.contents))
            .then(async (image) => {
                fileMetadata.originalHeight = image.getHeight();
                fileMetadata.originalWidth = image.getWidth();
                fileMetadata.mimeType = mimeType;
                if (image.getHeight() > 480) {
                    image = image.resize(AUTO, 480);
                }
                const compressed = image.quality(80);
                fileMetadata.newHeight = compressed.getHeight();
                fileMetadata.newWidth = compressed.getWidth();
                if (["dev", "test"].includes(process.env.SYS_ENV)) {
                    console.info("Writing compressed to file");
                    this.writeFileToBuild(this.getCompressedImageFileName(key), await image.getBufferAsync(image.getMIME()))
                }
                console.info("Converting compressed to buffer");
                return await compressed.getBufferAsync(image.getMIME());
            })
            .catch(error => {
                console.error(error);
                return null;
            });
        if (!!result) {
            const size = Buffer.byteLength(result);
            fileMetadata.newSize = size;
            fileMetadata.newName = this.getCompressedImageFileName(key);
            console.info(`Compressed image from ${file.length} to ${size}`);
            await this.uploadToS3(fileMetadata.newName, result);
            return fileMetadata;
        } else {
            console.error(`Could not compress image for ${key}`);
            return null;
        }
    };

    private readonly uploadToS3 = async (compressedFileName: string, data: Buffer): Promise<void> => {
        await this.s3.putObject({Bucket: process.env.S3_BUCKET_COMPRESSED, Key: compressedFileName, Body: data})
            .catch(error => console.error(error, `Error uploading object ${compressedFileName} into bucket ${process.env.S3_BUCKET_COMPRESSED}`));
    };

    private readonly getCompressedImageFileName = (key: string): string => {
        const keyArray = key.split(".");
        keyArray.splice(1, 0, "_compressed.");
        return keyArray.join("");
    };

    private readonly mapToProcessFileCompressedResult = (key: string, length: number, fileMetadata: FileMetadata[]): ProcessFileCompressedResult => {
        return {
            name: key.split("/").pop(),
            userId: key.split("/")[1],
            size: length,
            metadata: fileMetadata
        };
    };
}
