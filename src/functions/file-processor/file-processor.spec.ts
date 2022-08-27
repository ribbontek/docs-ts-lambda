import { LoginUserResponse } from "@models/auth.model";
import { FileEntity } from "@repos/file-entity";
import { authenticated, createAndUploadFile, fileDeleted, getAuthenticatedUserId, resetAuthentication, retrieveFileFromDynamoDbOnCondition, s3ready, saveFileToS3 } from "@test-utils/shared";
import { v4 as uuidv4 } from "uuid";

describe("File Processor Integration Test", () => {
    // set global timeout for jest
    jest.setTimeout(60000);

    const testId = uuidv4();
    let authToken: LoginUserResponse | null;
    let userId: string;

    beforeAll(async () => {
        await s3ready();
        console.log(`Setting up test ${testId}`);
        authToken = await authenticated(testId);
        expect(authToken).not.toBeNull();
        userId = await getAuthenticatedUserId(testId);
    });

    afterAll(async () => {
        await resetAuthentication(testId);
    });

    test(`expect success for valid mp4 video file and compressed is true`, async () => {
        const createResponse = await createAndUploadFile("crash1.mp4", authToken.accessToken);
        const result = await retrieveFileFromDynamoDbOnCondition(createResponse.fileId, userId, fileEntityCompressed, 30);
        expect(result).not.toBeNull();
    });

    test(`expect success for valid mov video file and compressed is true`, async () => {
        const createResponse = await createAndUploadFile("crash2.mov", authToken.accessToken);
        const result = await retrieveFileFromDynamoDbOnCondition(createResponse.fileId, userId, fileEntityCompressed, 30);
        expect(result).not.toBeNull();
    });

    test(`expect success for valid image file and uploaded is true and compressed is true and analyzed is true`, async () => {
        const createResponse = await createAndUploadFile("roomba1.jpg", authToken.accessToken);
        let result = await retrieveFileFromDynamoDbOnCondition(createResponse.fileId, userId, fileEntityUploaded, 10);
        expect(result).not.toBeNull();
        if (!result.compressed) {
            result = await retrieveFileFromDynamoDbOnCondition(createResponse.fileId, userId, fileEntityCompressed, 20);
        }
        if (!result.analyzed) {
            result = await retrieveFileFromDynamoDbOnCondition(createResponse.fileId, userId, fileEntityAnalyzed, 20);
        }
        expect(result.blocks.length).toBeGreaterThan(0)
        expect(result.blocks.filter(e => e.blockType == "LINE").length).toEqual(2)
        expect(result.tags.length).toBeGreaterThan(0)
        expect(result.tags).toEqual(["ROBBERBREAKSINTOMYHOUSE", "ME: ALEXA,", "RELEASE", "THE", "ROOMBAS"])
    });

    test(`expect file to be deleted when invalid file location`, async () => {
        await saveFileToS3("roomba3.jpg"); // should not find any association
        expect(await fileDeleted("roomba3.jpg")).toBeTruthy();
    });

    const fileEntityUploaded = (fileEntity: FileEntity): boolean => {
        return !!fileEntity && fileEntity.uploaded;
    };

    const fileEntityCompressed = (fileEntity: FileEntity): boolean => {
        return !!fileEntity && fileEntity.compressed;
    };

    const fileEntityAnalyzed = (fileEntity: FileEntity): boolean => {
        return !!fileEntity && fileEntity.analyzed;
    };
});


