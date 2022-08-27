import { LoginUserResponse } from "@models/auth.model";
import { authenticated, authenticatedJsonHeader, CREATE_FILE_URL, createFile, getAuthenticatedUserId, GREAT_SUCCESS, resetAuthentication, retrieveFileFromDynamoDb, s3ready, saveFileToS3UsingPreSignedUrl } from "@test-utils/shared";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

describe("Create File Integration Test", () => {
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

    // curl -X POST -H "Content-Type: application/json" -d '{name: "roomba.jpg"}' http://localhost:3000/test/v1/file/_create
    test(`expect success for valid request`, async () => {
        const validCreateFileRequest = {name: "roomba1.jpg"};
        const response = await createFile(validCreateFileRequest, authToken.accessToken);
        expect(response).not.toBeNull();
        expect(response.fileId).not.toBeUndefined();
        const dbResult = await retrieveFileFromDynamoDb(response.fileId, userId);
        expect(dbResult).not.toBeNull();
        expect(dbResult.fileId).toEqual(response.fileId);
        expect(dbResult.name).toEqual(response.name);
        expect(response.preSignedUrl).not.toBeNull();
        const fileUploaded = await saveFileToS3UsingPreSignedUrl(response.name, response.preSignedUrl);
        expect(fileUploaded).toBeTruthy();
    });

    test(`expect bad request for unsupported file type`, async () => {
        const invalidCreateFileRequest = {name: "disappointed.pdf"};
        const requestResult = await axios
            .post(CREATE_FILE_URL, invalidCreateFileRequest, authenticatedJsonHeader(authToken.accessToken))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(400);
                expect(message).toEqual(`File type not supported for file name: ${invalidCreateFileRequest.name}`);
                return false;
            });
        expect(requestResult).toBeFalsy();
    });

    test(`expect conflict for file already exists`, async () => {
        const validCreateFileRequest = {name: "disappointed.gif"};
        const response = await createFile(validCreateFileRequest, authToken.accessToken);
        expect(response).not.toBeNull();
        const requestResult = await axios
            .post(CREATE_FILE_URL, validCreateFileRequest, authenticatedJsonHeader(authToken.accessToken))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(409);
                expect(message).toEqual(`File found with same name: ${validCreateFileRequest.name}`);
                return false;
            });
        expect(requestResult).toBeFalsy();
    });

    test(`expect bad-request for invalid schema`, async () => {
        const invalidCreateFileRequest = {fileName: "roomba1.jpg"};
        const requestResult = await axios
            .post(CREATE_FILE_URL, invalidCreateFileRequest, authenticatedJsonHeader(authToken.accessToken))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(400);
                expect(message).toEqual("Bad Request");
                return false;
            });
        expect(requestResult).toBeFalsy();
    });
});
