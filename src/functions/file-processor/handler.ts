import { ImageProcessorService } from "@services/image-processor.service";
import { ImageTextractService } from "@services/image-textract.service";
import { InvalidFileRemoverService } from "@services/invalid-file-remover.service";
import { ValidFileUploadedService } from "@services/valid-file-uploaded.service";
import { VideoProcessorService } from "@services/video-processor.service";
import { S3Handler } from "aws-lambda";

const fileProcessor: S3Handler = async (event): Promise<any> => {
    console.info("fileProcessor received s3 event:", JSON.stringify(event, null, 2));
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

    if (["dev", "test"].includes(process.env.SYS_ENV) && (key.includes("_compressed") || key.includes("_analyzed") || key.includes("_textract"))) {
        return Promise.resolve();
    }

    const match = key.match(/(\/)/g);
    if (!(!match || match.length < 2)) {
        return Promise.all(
            [
                new ValidFileUploadedService().process(key),
                new VideoProcessorService().process(bucket, key),
                new ImageProcessorService().process(bucket, key),
                new ImageTextractService().process(bucket, key)
            ]
        );
    } else {
        return new InvalidFileRemoverService().process(bucket, key);
    }
};

export const main = fileProcessor;
