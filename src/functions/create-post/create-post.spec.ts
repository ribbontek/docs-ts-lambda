import { LoginUserResponse } from "@models/auth.model";
import { PrivacyEnum } from "@repos/post-entity";
import { authenticated, authenticatedJsonHeader, CREATE_POST_URL, createFile, createPost, getAuthenticatedUserId, GREAT_SUCCESS, resetAuthentication, retrievePostFromDynamoDb, s3ready } from "@test-utils/shared";
import axios from "axios";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

describe("Create Post Integration Test", () => {
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
        const fileId1 = await createFile({name: "roomba1.jpg"}, authToken.accessToken).then(file => file.fileId)
        const fileId2 = await createFile({name: "roomba2.jpg"}, authToken.accessToken).then(file => file.fileId)
        const validCreatePostRequest = {message: crypto.randomBytes(100).toString("hex"), fileIds: [fileId1, fileId2], privacy: PrivacyEnum.ME};
        const response = await createPost(validCreatePostRequest, authToken.accessToken);
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

    test(`expect bad-request for invalid schema 1`, async () => {
        const invalidCreateFileRequest = {message: 1234, fileIds: "askdfaklsdnfkljnsakj", privacy: PrivacyEnum.ME};
        const requestResult = await axios
            .post(CREATE_POST_URL, invalidCreateFileRequest, authenticatedJsonHeader(authToken.accessToken))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(400);
                expect(message).toEqual("Bad Request");
                return false;
            });
        expect(requestResult).toBeFalsy();
    });

    test(`expect bad-request for invalid schema 2 - custom array test`, async () => {
        const invalidCreateFileRequest = {message: crypto.randomBytes(1001).toString("hex"), fileIds: ["askdfaklsdnfkljnsakj"], privacy: PrivacyEnum.ME};
        const requestResult = await axios
            .post(CREATE_POST_URL, invalidCreateFileRequest, authenticatedJsonHeader(authToken.accessToken))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(400);
                expect(message).toEqual("Bad Request");
                return false;
            });
        expect(requestResult).toBeFalsy();
    });

    test(`expect bad-request for invalid schema 3 - invalid enum test`, async () => {
        const invalidCreateFileRequest = {message: crypto.randomBytes(100).toString("hex"), fileIds: [], privacy: "windows"};
        const requestResult = await axios
            .post(CREATE_POST_URL, invalidCreateFileRequest, authenticatedJsonHeader(authToken.accessToken))
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
