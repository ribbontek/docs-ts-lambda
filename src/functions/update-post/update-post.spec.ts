import { LoginUserResponse } from "@models/auth.model";
import { authenticated, authenticatedJsonHeader, createPost, getAuthenticatedUserId, GREAT_SUCCESS, resetAuthentication, retrievePostFromDynamoDb, s3ready, UPDATE_POST_URL, updatePost } from "@test-utils/shared";
import axios from "axios";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

describe("Update Post Integration Test", () => {
    // set global timeout for jest
    jest.setTimeout(30000);

    const testId = uuidv4();
    let authToken: LoginUserResponse | null;
    let userId: string;

    beforeAll(async () => {
        await s3ready();
        console.log(`Setting up test ${testId}`)
        authToken = await authenticated(testId);
        expect(authToken).not.toBeNull();
        userId = await getAuthenticatedUserId(testId);
    });

    afterAll(async () => {
        await resetAuthentication(testId);
    });

    test(`expect success for valid request`, async () => {
        const validCreatePostRequest = {message: crypto.randomBytes(100).toString("hex"), fileIds: [], privacy: "me"};
        const createResponse = await createPost(validCreatePostRequest, authToken.accessToken);
        expect(createResponse).not.toBeNull();
        const validUpdatePostRequest = {postId: createResponse.postId, message: crypto.randomBytes(100).toString("hex"), fileIds: [uuidv4()], privacy: "followers"};
        const response = await updatePost(validUpdatePostRequest, authToken.accessToken);
        expect(response).not.toBeNull();
        const dbResult = await retrievePostFromDynamoDb(response.postId, userId);
        expect(dbResult).not.toBeNull();
        expect(dbResult.postId).toEqual(response.postId);
        expect(dbResult.message).toEqual(response.message);
        expect(dbResult.privacy).toEqual(response.privacy);
        expect(dbResult.fileIds).toEqual(response.fileIds);
        expect(dbResult.created).toEqual(response.created);
        expect(dbResult.updated).toEqual(response.updated);
    });

    test(`expect bad-request for invalid schema`, async () => {
        const invalidCreateFileRequest = {message: 1234, fileIds: "askdfaklsdnfkljnsakj", privacy: "windows"};
        const requestResult = await axios
            .post(UPDATE_POST_URL, invalidCreateFileRequest, authenticatedJsonHeader(authToken.accessToken))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(400);
                expect(message).toEqual("Bad Request");
                return false;
            });
        expect(requestResult).toBeFalsy();
    });

    test(`expect not-found for invalid post id`, async () => {
        const invalidId = uuidv4();
        const invalidUpdateFileRequest = {postId: invalidId, message: crypto.randomBytes(100).toString("hex"), fileIds: [], privacy: "me"};
        const requestResult = await axios
            .post(UPDATE_POST_URL, invalidUpdateFileRequest, authenticatedJsonHeader(authToken.accessToken))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(404);
                expect(message).toEqual(`Post not found for id: ${invalidId}`);
                return false;
            });
        expect(requestResult).toBeFalsy();
    });
});
