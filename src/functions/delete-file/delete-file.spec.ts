import { LoginUserResponse } from "@models/auth.model";
import { PostRepository } from "@repos/post-repository";
import { authenticated, authenticatedJsonHeader, createFile, DELETE_FILE_URL, deleteFile, getAuthenticatedUserId, GREAT_SUCCESS, resetAuthentication, s3ready } from "@test-utils/shared";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

describe("Delete File Integration Test", () => {
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
        const validCreateFileRequest = {name: "roomba1.png"};
        const createResponse = await createFile(validCreateFileRequest, authToken.accessToken);
        expect(createResponse).not.toBeNull();
        const validDeleteFileRequest = {fileId: createResponse.fileId};
        const response = await deleteFile(validDeleteFileRequest, authToken.accessToken);
        expect(response).toBeTruthy();
        const dbResult = await new PostRepository().getPost(validDeleteFileRequest.fileId, userId);
        expect(dbResult).toBeNull();
    });

    test(`expect bad-request for invalid schema`, async () => {
        const requestResult = await axios
            .delete(DELETE_FILE_URL.replace("fileId", "1234"), authenticatedJsonHeader(authToken.accessToken))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(400);
                expect(message).toEqual("Bad Request");
                return false;
            });
        expect(requestResult).toBeFalsy();
    });

    test(`expect not-found for invalid file id`, async () => {
        const invalidId = uuidv4();
        const requestResult = await axios
            .delete(DELETE_FILE_URL.replace("fileId", invalidId), authenticatedJsonHeader(authToken.accessToken))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(404);
                expect(message).toEqual(`File not found for id: ${invalidId}`);
                return false;
            });
        expect(requestResult).toBeFalsy();
    });
});
