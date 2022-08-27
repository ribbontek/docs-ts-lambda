import { LoginUserResponse } from "@models/auth.model";
import { PostResponse, GetPostResponse } from "@models/post.model";
import { PostEntity } from "@repos/post-entity";
import { authenticated, authenticatedJsonHeader, createPost, GET_POST_URL, getAuthenticatedUserId, getPost, GREAT_SUCCESS, resetAuthentication, retrievePostFromDynamoDb, s3ready } from "@test-utils/shared";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

describe("Get Post Integration Test", () => {
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
        const createResponse: PostResponse = await createPost({message: "asdfghjkl", fileIds: [], privacy: "me"}, authToken.accessToken);
        const getPostResponse = await getPost(createResponse.postId, authToken.accessToken);
        expect(getPostResponse).not.toBeNull()
        const postEntity = await retrievePostFromDynamoDb(createResponse.postId, userId);
        console.log(`GET POST RESPONSE >> ${JSON.stringify(getPostResponse)}`);
        shouldEqual(getPostResponse, postEntity);
    });

    test(`expect not-found for invalid post id`, async () => {
        const invalidId = uuidv4();
        const requestResult = await axios
            .get(`${GET_POST_URL}/${invalidId}`, authenticatedJsonHeader(authToken.accessToken))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(404);
                expect(message).toEqual(`Post not found for id: ${invalidId}`);
                return false;
            });
        expect(requestResult).toBeFalsy();
    });

    test(`expect bad-request for invalid post id format`, async () => {
        const invalidId = 1;
        const requestResult = await axios
            .get(`${GET_POST_URL}/${invalidId}`, authenticatedJsonHeader(authToken.accessToken))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(400);
                expect(message).toEqual("Bad Request");
                return false;
            });
        expect(requestResult).toBeFalsy();
    });

    const shouldEqual = (response: GetPostResponse, entity: PostEntity) => {
        expect(response.postId).toEqual(entity.postId);
        expect(response.message).toEqual(entity.message);
        expect(response.privacy).toEqual(entity.privacy);
        expect(response.fileIds).toEqual(entity.fileIds);
        expect(response.created).toEqual(entity.created);
        expect(response.updated).toEqual(entity.updated);
    };
});


