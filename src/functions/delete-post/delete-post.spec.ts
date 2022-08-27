import { LoginUserResponse } from "@models/auth.model";
import { PostRepository } from "@repos/post-repository";
import { authenticated, authenticatedJsonHeader, createPost, DELETE_POST_URL, deletePost, getAuthenticatedUserId, GREAT_SUCCESS, resetAuthentication, s3ready } from "@test-utils/shared";
import axios from "axios";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

describe("Delete Post Integration Test", () => {
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
        const validCreatePostRequest = {message: crypto.randomBytes(100).toString("hex"), fileIds: [], privacy: "me"};
        const createResponse = await createPost(validCreatePostRequest, authToken.accessToken);
        expect(createResponse).not.toBeNull();
        const validDeletePostRequest = {postId: createResponse.postId};
        const response = await deletePost(validDeletePostRequest, authToken.accessToken);
        expect(response).toBeTruthy();
        const dbResult = await new PostRepository().getPost(validDeletePostRequest.postId, userId);
        expect(dbResult).toBeNull();
    });

    test(`expect bad-request for invalid schema`, async () => {
        const requestResult = await axios
            .delete(DELETE_POST_URL.replace("postId", "1234"), authenticatedJsonHeader(authToken.accessToken))
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
        const requestResult = await axios
            .delete(DELETE_POST_URL.replace("postId", invalidId), authenticatedJsonHeader(authToken.accessToken))
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
