import videoFormatToMimetype from "@libs/video-format-to-mimetype";
import { FileMetadata, ProcessFileCompressedResult, S3File } from "@models/file.model";
import { AbstractFileProcessor, FileProcessorI } from "@services/file-processor.service";
import polling from "light-async-polling";
import { PassThrough } from "stream";

const ffmpeg = require("fluent-ffmpeg");

interface FfprobeData {
    duration: number;
    bitrate: number;
}

export class VideoProcessorService extends AbstractFileProcessor implements FileProcessorI {

    public process = async (bucket: string, key: string): Promise<void> => {
        console.info(`Processing file in bucket ${bucket} with key ${key}`);
        const extMimeType = videoFormatToMimetype[key.split(".").pop()];
        if (!!extMimeType) {
            console.info(`Found matching video type for file ${extMimeType}`);
            return this.retrieveFileAsync(bucket, key)
                .then((file) => this.compressVideo(file).then(data => this.saveToRepository(this.mapToProcessFileCompressedResult(key, file.length, data))))
                .catch(error => console.error(error));
        } else {
            console.error(`Error processing file in bucket ${bucket} with key ${key}`);
            return Promise.resolve();
        }
    };

    private readonly compressVideo = async (file: S3File): Promise<FileMetadata[]> => {
        ffmpeg.setFfmpegPath("./third-party/ffmpeg-4.4.1-linux-64/ffmpeg");
        ffmpeg.setFfprobePath("./third-party/ffprobe-4.4.1-linux-64/ffprobe");
        let fileMetadata: FileMetadata[] = [];
        try {
            const fileUrl = await this.saveToTmp(file);
            const toFormat = "avi";
            await this.ffprobeData(fileUrl);
            for (const size of ["640x360", "640x480", "1280x720", "1920x1080"]) {
                const meta = new FileMetadata();
                const runFfmpeg = async (): Promise<void> => {
                    return new Promise<void>(async (resolve, _) => {
                        const chunks = [];
                        const passThroughStream = new PassThrough();
                        passThroughStream.on("data", (chunk) => chunks.push(chunk));
                        ffmpeg(fileUrl, {logger: console})
                            // NOTE: Video Options
                            .size(size)
                            .aspect("16:9")
                            .applyAutopadding(true, "black")
                            .videoCodec("libx264")
                            .audioCodec("libmp3lame")
                            .toFormat(toFormat)
                            .on("error", (error) => {
                                console.error(error);
                                resolve();
                            })
                            .on("end", async () => {
                                const buffer = Buffer.concat(chunks);
                                const compressedFileName = this.getCompressedVideoFileName(file.key, size, toFormat);
                                if (["dev", "test"].includes(process.env.SYS_ENV)) {
                                    this.writeFileToBuild(compressedFileName, buffer);
                                }
                                await this.uploadToS3(compressedFileName, buffer);
                                meta.newSize = Buffer.byteLength(buffer);
                                meta.newName = compressedFileName;
                                resolve();
                            })
                            .on("codecData", (data) => {
                                // i.e. Input is aac (LC) (mp4a / 0x6134706D) audio with h264 (High) (avc1 / 0x31637661) video with 00:00:13.50 duration
                                console.info("Input is " + data.audio + " audio " +
                                                 "with " + data.video + " video " +
                                                 "with " + data.duration + " duration");
                                meta.videoCodec = data.video;
                                meta.audioCodec = data.audio;
                                meta.duration = data.duration;
                            })
                            .on("stderr", (output) => {
                                console.info(output);
                            })
                            .on("start", (cmd) => {
                                console.info("Starting " + cmd);
                            })
                            .output(passThroughStream, {end: true})
                            .run();
                    });
                };
                await runFfmpeg();
                fileMetadata.push(meta);
            }
        } catch (error) {
            console.error(error);
            fileMetadata = [];
        } finally {
            await this.removeTmpFiles();
        }
        return fileMetadata;
    };

    private readonly ffprobeData = async (fileUrl: string): Promise<FfprobeData> => {
        try {
            let duration = -1;
            let bitrate = -1;
            ffmpeg.ffprobe(fileUrl, (err, metadata) => {
                if (!!metadata) {
                    console.info(metadata); // all metadata
                    bitrate = metadata.format.bit_rate;
                    duration = metadata.format.duration;
                } else {
                    console.error("ffprobe exception", err);
                    duration = 0;
                }
            });
            await polling(() => duration != -1, 1000);
            return Promise.resolve({duration: Math.ceil(duration), bitrate}); // round up duration
        } catch (e) {
            console.error(e);
            return Promise.reject();
        }
    };

    private readonly uploadToS3 = async (compressedFileName: string, data: Buffer): Promise<void> => {
        await this.s3.putObject({Bucket: process.env.S3_BUCKET_COMPRESSED, Key: compressedFileName, Body: data})
            .catch(error => console.error(error, `Error uploading object ${compressedFileName} into bucket ${process.env.S3_BUCKET_COMPRESSED}`));
    };

    private readonly saveToTmp = async (file: S3File): Promise<string | null> => {
        return this.writeFileToTmp(file.key, await this.streamToBuffer(file.contents));
    };

    private readonly getCompressedVideoFileName = (key: string, size: string, format: string): string => {
        const keyArray = key.split(".");
        keyArray.splice(1, 1, `_compressed_${size}.${format}`);
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
