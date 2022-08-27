import { LoginUserResponse } from "@models/auth.model";
import { CreateFileResponse, GetFileResponse } from "@models/file.model";
import { FileEntity } from "@repos/file-entity";
import { authenticated, authenticatedJsonHeader, createFile, GET_FILE_URL, getAuthenticatedUserId, getFile, GREAT_SUCCESS, resetAuthentication, retrieveFileFromDynamoDb, retrieveFileFromS3UsingPreSignedUrl, s3ready, saveFileToS3UsingPreSignedUrl } from "@test-utils/shared";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

describe("Get File Integration Test", () => {
    // set global timeout for jest
    jest.setTimeout(30000);

    const testId = uuidv4();
    let authToken: LoginUserResponse | null;
    let userId: string;

    beforeAll(async () => {
        await s3ready();
        authToken = await authenticated(testId);
        expect(authToken).not.toBeNull();
        userId = await getAuthenticatedUserId(testId);
    });

    afterAll(async () => {
        await resetAuthentication(testId);
    });

    test(`expect success for valid request`, async () => {
        const createResponse: CreateFileResponse = await createFile({name: "roomba1.jpg"}, authToken.accessToken)
            .then(async response => {
                await saveFileToS3UsingPreSignedUrl(response.name, response.preSignedUrl);
                return response;
            });
        const getFileResponse = await getFile(createResponse.fileId, authToken.accessToken);
        console.log(`GET FILE RESPONSE >> ${JSON.stringify(getFileResponse)}`);
        expect(getFileResponse).not.toBeNull()
        expect(getFileResponse.fileId).not.toBeUndefined()
        const fileEntity = await retrieveFileFromDynamoDb(getFileResponse.fileId, userId);
        shouldEqual(getFileResponse, fileEntity);
        const fileReceived = await retrieveFileFromS3UsingPreSignedUrl(getFileResponse.name, getFileResponse.preSignedUrl);
        expect(fileReceived).toBeTruthy();
    });

    test(`expect not-found for invalid file id`, async () => {
        const invalidId = uuidv4();
        const requestResult = await axios
            .get(`${GET_FILE_URL}/${invalidId}`, authenticatedJsonHeader(authToken.accessToken))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(404);
                expect(message).toEqual(`File not found for id: ${invalidId}`);
                return false;
            });
        expect(requestResult).toBeFalsy();
    });

    test(`expect bad-request for invalid file id format`, async () => {
        const invalidId = 1;
        const requestResult = await axios
            .get(`${GET_FILE_URL}/${invalidId}`, authenticatedJsonHeader(authToken.accessToken))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(400);
                expect(message).toEqual("Bad Request");
                return false;
            });
        expect(requestResult).toBeFalsy();
    });

    const shouldEqual = (response: GetFileResponse, fileEntity: FileEntity) => {
        expect(response.fileId).toEqual(fileEntity.fileId);
        expect(response.name).toEqual(fileEntity.name);
        expect(response.size).toBeGreaterThanOrEqual(0); // size gets updated by the file-processor
        expect(response.extension).toEqual(fileEntity.extension);
        expect(response.uploaded).not.toBeUndefined();
        expect(fileEntity.uploaded).not.toBeUndefined(); // uploaded gets updated by the file-processor
        expect(response.tags).toEqual(fileEntity.tags);
        expect(response.preSignedUrl).not.toBeNull();
    };
});


