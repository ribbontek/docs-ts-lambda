import { LoginUserResponse } from "@models/auth.model";
import { GetPostResponse, PostResponse } from "@models/post.model";
import { PrivacyEnum } from "@repos/post-entity";
import { authenticated, authenticatedJsonHeader, createPost, getAuthenticatedUserId, GREAT_SUCCESS, resetAuthentication, s3ready, SEARCH_POSTS_URL, searchPost } from "@test-utils/shared";
import axios from "axios";
import * as crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

describe("Search Posts Integration Test", () => {
    // set global timeout for jest
    jest.setTimeout(30000);

    const testId = uuidv4();
    const otherTestId = uuidv4();
    let authToken: LoginUserResponse | null;
    let userId: string;
    let testUserId: string;
    let posts: PostResponse[] = [];

    beforeAll(async () => {
        await s3ready();
        const otherUserAuthToken = await authenticated(otherTestId);
        expect(otherUserAuthToken).not.toBeNull();
        testUserId = await getAuthenticatedUserId(otherTestId);
        authToken = await authenticated(testId);
        expect(authToken).not.toBeNull();
        userId = await getAuthenticatedUserId(testId);
        posts = await Promise.all(
            [
                createPost({message: crypto.randomBytes(100).toString("hex"), fileIds: [], privacy: PrivacyEnum.ME}, otherUserAuthToken.accessToken),
                createPost({message: crypto.randomBytes(100).toString("hex"), fileIds: [], privacy: PrivacyEnum.ME}, otherUserAuthToken.accessToken),
                createPost({message: crypto.randomBytes(100).toString("hex"), fileIds: [], privacy: PrivacyEnum.ME}, otherUserAuthToken.accessToken),
                createPost({message: crypto.randomBytes(100).toString("hex"), fileIds: [], privacy: PrivacyEnum.EVERYONE}, otherUserAuthToken.accessToken),
                createPost({message: crypto.randomBytes(100).toString("hex"), fileIds: [], privacy: PrivacyEnum.EVERYONE}, otherUserAuthToken.accessToken),
                createPost({message: crypto.randomBytes(100).toString("hex"), fileIds: [], privacy: PrivacyEnum.EVERYONE}, otherUserAuthToken.accessToken),
                createPost({message: crypto.randomBytes(100).toString("hex"), fileIds: [], privacy: PrivacyEnum.EVERYONE}, otherUserAuthToken.accessToken),
                createPost({message: crypto.randomBytes(100).toString("hex"), fileIds: [], privacy: PrivacyEnum.EVERYONE}, otherUserAuthToken.accessToken),
                createPost({message: crypto.randomBytes(100).toString("hex"), fileIds: [], privacy: PrivacyEnum.EVERYONE}, otherUserAuthToken.accessToken),
            ]
        ).then(data => data.filter(post => post != null));
    });

    afterAll(async () => {
        await resetAuthentication(testId);
        await resetAuthentication(otherTestId);
    });

    test(`expect success for valid request - should return empty as it isn't for everyone`, async () => {
        const searchPost = posts.filter(post => post.privacy == PrivacyEnum.ME)[0];
        const param = {message: searchPost.message.substring(0, 50), userId: null, limit: 50, lastEvaluatedKey: null};
        const results = await runTests(param);
        expect(results.length).toEqual(0);
    });

    test(`expect success for valid request - should return single result`, async () => {
        const searchPost = posts.filter(post => post.privacy == PrivacyEnum.EVERYONE)[0];
        console.info(`searching for message ${searchPost.message.substring(0, 50)}`)
        // Note: bump up the limit to scan all possible records to find a match (Doesn't behave like an RDB)
        const param = {message: searchPost.message.substring(0, 50), userId: null, limit: 50, lastEvaluatedKey: null};
        const results = await runTests(param);
        expect(results.length).toEqual(1);
        expect(results[0].postId).toEqual(searchPost.postId);
    });

    test(`expect success for valid request 2 - should find all posts created initially`, async () => {
        const param = {message: null, userId: testUserId, limit: 50, lastEvaluatedKey: null};
        const results = await runTests(param);
        expect(results.length).toBeGreaterThanOrEqual(6);
    });

    test(`expect success for valid request 2 - should find no posts created for test user`, async () => {
        const param = {message: null, userId, limit: 50, lastEvaluatedKey: null};
        const results = await runTests(param);
        expect(results.length).toEqual(0);
    });

    test(`expect success for valid request 3`, async () => {
        const searchPost = posts.filter(post => post.privacy == PrivacyEnum.ME)[0];
        const param = {message: searchPost.message.substring(0, 50), userId: testUserId, limit: 50, lastEvaluatedKey: null};
        const results = await runTests(param);
        expect(results.length).toBeGreaterThanOrEqual(6);
    });

    test(`expect success for valid request 4`, async () => {
        const param = {message: null, userId: null, limit: 50, lastEvaluatedKey: null};
        const results = await runTests(param);
        expect(results.length).toBeGreaterThanOrEqual(6);
    });

    test(`expect bad-request for invalid request format`, async () => {
        const requestResult = await axios
            .post(SEARCH_POSTS_URL, {message: 124, userId: "me"}, authenticatedJsonHeader(authToken.accessToken))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(400);
                expect(message).toEqual("Bad Request");
                return false;
            });
        expect(requestResult).toBeFalsy();
    });

    const runTests = async (param: { message: string | null, userId: string | null, limit: number, lastEvaluatedKey: any }): Promise<GetPostResponse[]> => {
        const dataCollector = [];
        const response = await searchPost(param, authToken.accessToken);
        expect(response).not.toBeNull();
        expect(response.data.length).toEqual(response.size);
        if (response.size < response.total) {
            expect(response.lastEvaluatedKey).toBeTruthy();
        }
        dataCollector.push(...response.data);
        expect(dataCollector.length).toEqual(response.total);
        return dataCollector;
    };
});


