import { DetectDocumentTextCommand, DetectDocumentTextCommandOutput } from "@aws-sdk/client-textract";
import { textractClient } from "@clients/textract-client";
import { handleApiError } from "@libs/utils";
import { NotFoundException } from "@models/exception.model";
import { TextractBlock, TextractFile } from "@models/file.model";
import { AbstractFileProcessor, FileProcessorI } from "@services/file-processor.service";
import * as Jimp from "jimp";

const getMime = require("name2mime");

export class ImageTextractService extends AbstractFileProcessor implements FileProcessorI {

    constructor(private readonly textract = textractClient()) {
        super();
    }

    public process = async (bucket: string, key: string): Promise<void> => {
        console.info(`Processing file in bucket ${bucket} with key ${key}`);
        const mimeType = await getMime(key);
        console.info(`Found mime type for file ${mimeType.type}`);
        if (this.textractSupportsMimeType(mimeType.type)) {
            console.info("Textract supports file type");
            const imageData = await this.retrieveFileAsync(bucket, key);
            const imageBuffer = await this.streamToBuffer(imageData.contents);
            const result = await this.detectText(imageBuffer);
            const textractFile = await this.createDetectedTextImageBuffer(imageBuffer, result);
            const name = this.getAnalyzedImageFileName(key);
            if (["dev", "test"].includes(process.env.SYS_ENV)) {
                console.info(`Writing analyzed image ${name} to file`);
                this.writeFileToBuild(name, textractFile.buffer);
            }
            await this.uploadToS3(name, textractFile.buffer);
            return this.saveAnalyzedResults(key.split("/").pop(), key.split("/")[1], textractFile.blocks)
                .catch(error => console.error(error));
        } else {
            console.error(`Invalid file for image-textract in bucket ${bucket} with key ${key}`);
            return Promise.resolve();
        }
    };

    private readonly uploadToS3 = async (analyzedFileName: string, data: Buffer): Promise<void> => {
        await this.s3.putObject({Bucket: process.env.S3_BUCKET_ANALYZED, Key: analyzedFileName, Body: data})
            .catch(error => console.error(error, `Error uploading object ${analyzedFileName} into bucket ${process.env.S3_BUCKET_ANALYZED}`));
    };

    private readonly createDetectedTextImageBuffer = async (buffer: Buffer, output: DetectDocumentTextCommandOutput): Promise<TextractFile | null> => {
        return Jimp.read(buffer)
            .then(async (image) => {
                const height = image.getHeight();
                const width = image.getWidth();
                const blocks: TextractBlock[] = [];
                output.Blocks.forEach(block => {
                    console.log(`Block Type: ${block.BlockType}`);
                    console.log(`Text: ${block.Text}`);
                    console.log(`TextType: ${block.TextType}`);
                    console.log(`Confidence: ${block.Confidence}`);
                    const funIterator = function iterator(_x, _y, offset) {
                        this.bitmap.data.writeUInt32BE(0x00FF00FF, offset);
                    };
                    // Draw box around detected text using Bounding Box
                    if (block.BlockType == "LINE") {
                        const lineWidth = 10;
                        const x = block.Geometry.BoundingBox.Left * width;
                        const y = block.Geometry.BoundingBox.Top * height;
                        const w = block.Geometry.BoundingBox.Width * width;
                        const h = block.Geometry.BoundingBox.Height * height;
                        console.info("Bounding Box", JSON.stringify({x, y, w, h}));
                        // canvas.scan(x, y, w, h, funIterator); NOTE: THIS DISPLAYS A FULLY SHADED BOX
                        image.scan(x - lineWidth, y, lineWidth, h + lineWidth, funIterator);
                        image.scan(x + w, y, lineWidth, h + lineWidth, funIterator);
                        image.scan(x - lineWidth, y - lineWidth, w + (lineWidth * 2), lineWidth, funIterator);
                        image.scan(x, y + h, w, lineWidth, funIterator);
                    }
                    console.log("-----");
                    blocks.push(
                        {
                            blockType: block.BlockType,
                            confidence: block.Confidence,
                            textType: block.TextType,
                            text: block.Text
                        }
                    );
                });
                return new TextractFile(
                    await image.getBufferAsync(image.getMIME()),
                    blocks
                );
            }).catch(error => {
                console.error(error);
                return null;
            });
    };

    private readonly detectText = async (buffer: Buffer): Promise<DetectDocumentTextCommandOutput> => {
        return this.textract.send(new DetectDocumentTextCommand({Document: {Bytes: Uint8Array.from(buffer)}}));
    };

    private readonly textractSupportsMimeType = (mimeType: string): boolean => {
        // Textract supported types = PDF, TIFF, JPG, PNG - NOTE: Not going to support "application/pdf"
        const supportedMimeTypes: string[] = ["image/tiff", "image/jpeg", "image/png"];
        return supportedMimeTypes.includes(mimeType);
    };

    private readonly getAnalyzedImageFileName = (key: string): string => {
        const keyArray = key.split(".");
        keyArray.splice(1, 0, "_analyzed.");
        return keyArray.join("");
    };

    private readonly saveAnalyzedResults = async (name: string, userId: string, blocks: TextractBlock[]): Promise<void> => {
        return this.fileRepository.getByNameAndUserId(name, userId)
            .then(entity => {
                if (!!entity) {
                    this.fileRepository.saveAnalyzedResults(entity.fileId, entity.userId, blocks);
                } else {
                    throw new NotFoundException(`File not found for name ${name} and user id ${userId}`);
                }
            })
            .catch(error => handleApiError(error));
    };
}
