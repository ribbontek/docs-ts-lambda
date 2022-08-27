import { AdminDeleteUserCommandOutput } from "@aws-sdk/client-cognito-identity-provider";
import { PutObjectCommandOutput } from "@aws-sdk/client-s3";
import { s3Client } from "@clients/s3-client";
import { encodeBase64 } from "@libs/utils";
import { LoginUserResponse, RegisterUserCommand, RegisterUserResponse } from "@models/auth.model";
import { CreateFileResponse, GetFileResponse } from "@models/file.model";
import { GetPostResponse, PostResponse, SearchPostResponse } from "@models/post.model";
import { FileEntity } from "@repos/file-entity";
import { FileRepository } from "@repos/file-repository";
import { PostEntity } from "@repos/post-entity";
import { PostRepository } from "@repos/post-repository";
import { UserRepository } from "@repos/user-repository";
import { AuthService } from "@services/auth.service";
import axios from "axios";
// @ts-ignore
import * as fs from "fs";
import polling from "light-async-polling";

export const SLS_LOCALHOST = "http://localhost:3000";
export const CREATE_POST_URL = `${SLS_LOCALHOST}/test/v1/post/_create`;
export const UPDATE_POST_URL = `${SLS_LOCALHOST}/test/v1/post/_update`;
export const SEARCH_POSTS_URL = `${SLS_LOCALHOST}/test/v1/post/_search`;
export const DELETE_POST_URL = `${SLS_LOCALHOST}/test/v1/post/postId`;
export const DELETE_FILE_URL = `${SLS_LOCALHOST}/test/v1/file/fileId`;
export const CREATE_FILE_URL = `${SLS_LOCALHOST}/test/v1/file/_create`;
export const USER_LOGIN_URL = `${SLS_LOCALHOST}/test/v1/user/_login`;
export const USER_REGISTER_URL = `${SLS_LOCALHOST}/test/v1/user/_register`;
export const FORGET_PASSWORD_URL = `${SLS_LOCALHOST}/test/v1/user/_forget-password`;
export const RESET_PASSWORD_URL = `${SLS_LOCALHOST}/test/v1/user/_reset-password`;
export const GET_FILE_URL = `${SLS_LOCALHOST}/test/v1/file`;
export const GET_POST_URL = `${SLS_LOCALHOST}/test/v1/post`;
export const S3_LOCALHOST = "http://localhost:4569/"; // S3 location
export const GREAT_SUCCESS = 200;
export const APPLICATION_JSON = {headers: {contentType: "application/json"}};
export const OCTET_STREAM = {headers: {contentType: "application/octet-stream"}, maxContentLength: Infinity, maxBodyLength: Infinity};

export const authenticatedJsonHeader = (accessToken: string) => {
    return {
        headers: {
            contentType: "application/json",
            Authorization: `Bearer ${accessToken}`
        }
    };
};

export const getAuthenticatedUserId = async (testName: string = "unknown"): Promise<string> => {
    return new UserRepository().getByEmail(`ribbontek+${testName}@gmail.com`).then(data => data.userId);
};

export const authenticated = async (testName: string = "unknown"): Promise<LoginUserResponse | null> => {
    const user = {
        email: `ribbontek+${testName}@gmail.com`,
        password: process.env.TEST_PASSWORD,
        firstName: "test",
        lastName: "user"
    };
    return registerUser(user).then(_ => loginUser(user.email, user.password));
};

export const resetAuthentication = async (testName: string = "unknown"): Promise<AdminDeleteUserCommandOutput | void> => {
    return new AuthService().deleteUser(`ribbontek+${testName}@gmail.com`)
        .catch(error => console.error(error));
};

export const getFile = async (fileId: string, token: string): Promise<GetFileResponse | null> => {
    return axios
        .get(`${GET_FILE_URL}/${fileId}`, authenticatedJsonHeader(token))
        .then(res => {
            console.info(JSON.stringify(res.data));
            return res.data as GetFileResponse;
        })
        .catch(error => {
            console.error(error);
            return null;
        });
};

export const getPost = async (postId: string, token: string): Promise<GetPostResponse | null> => {
    return axios
        .get(`${GET_POST_URL}/${postId}`, authenticatedJsonHeader(token))
        .then(res => {
            console.info(JSON.stringify(res.data));
            return res.data as GetPostResponse;
        })
        .catch(error => {
            console.error(error);
            return null;
        });
};

export const createPost = async (createPostRequest: { message: string, fileIds: string[], privacy: string }, token: string): Promise<PostResponse | null> => {
    return axios
        .post(CREATE_POST_URL, createPostRequest, authenticatedJsonHeader(token))
        .then(res => {
            console.info(JSON.stringify(res.data));
            return res.data as PostResponse;
        })
        .catch(error => {
            console.error(error);
            return null;
        });
};

export const searchPost = async (searchPostRequest: { message: string | null, userId: string | null, limit: number, lastEvaluatedKey: any }, token: string): Promise<SearchPostResponse | null> => {
    return axios
        .post(SEARCH_POSTS_URL, searchPostRequest, authenticatedJsonHeader(token))
        .then(res => {
            console.info(JSON.stringify(res.data));
            return res.data as PostResponse;
        })
        .catch(error => {
            console.error(error);
            return null;
        });
};


export const updatePost = async (updatePostRequest: { postId: string, message: string, fileIds: string[], privacy: string }, token: string): Promise<PostResponse | null> => {
    return axios
        .post(UPDATE_POST_URL, updatePostRequest, authenticatedJsonHeader(token))
        .then(res => {
            console.info(JSON.stringify(res.data));
            return res.data as PostResponse;
        })
        .catch(error => {
            console.error(error);
            return null;
        });
};

export const deletePost = async (deletePostRequest: { postId: string }, token: string): Promise<boolean> => {
    return axios
        .delete(DELETE_POST_URL.replace("postId", deletePostRequest.postId), authenticatedJsonHeader(token))
        .then(res => {
            console.info(JSON.stringify(res.data));
            return true;
        })
        .catch(error => {
            console.error(error);
            return false;
        });
};

export const deleteFile = async (deleteFileRequest: { fileId: string }, token: string): Promise<boolean> => {
    return axios
        .delete(DELETE_FILE_URL.replace("fileId", deleteFileRequest.fileId), authenticatedJsonHeader(token))
        .then(res => {
            console.info(JSON.stringify(res.data));
            return true;
        })
        .catch(error => {
            console.error(error);
            return false;
        });
};

export const createFile = async (createFileRequest: { name: string }, token: string): Promise<CreateFileResponse | null> => {
    return axios
        .post(CREATE_FILE_URL, createFileRequest, authenticatedJsonHeader(token))
        .then(res => {
            console.info(JSON.stringify(res.data));
            return res.data as CreateFileResponse;
        })
        .catch(error => {
            console.error(error);
            return null;
        });
};

export const registerUser = async (registerUserRequest: RegisterUserCommand): Promise<RegisterUserResponse | null> => {
    return axios
        .post(USER_REGISTER_URL, registerUserRequest, APPLICATION_JSON)
        .then(res => {
            console.info(JSON.stringify(res.data));
            return res.data as RegisterUserResponse;
        })
        .catch(error => {
            console.error(error);
            return null;
        });
};

export const loginUser = async (email: string, password: string): Promise<LoginUserResponse | null> => {
    return axios
        .post(USER_LOGIN_URL, {}, basicAuthHeaders(email, password))
        .then(res => {
            console.info(JSON.stringify(res.data));
            return res.data as LoginUserResponse;
        })
        .catch(error => {
            console.error(error);
            return null;
        });
};

export const forgetPassword = async (email: string): Promise<boolean> => {
    return await axios
        .post(FORGET_PASSWORD_URL, {email}, APPLICATION_JSON)
        .then(res => res.status == GREAT_SUCCESS)
        .catch(error => {
            console.error(error);
            return false;
        });
}

export const s3ready = async (): Promise<Boolean> => {
    const asyncFn = async () => {
        return await axios
            .get(S3_LOCALHOST)
            .then(res => res.status == GREAT_SUCCESS)
            .catch(_ => false);
    };
    return polling(asyncFn, 1000);
};

export const saveFileToS3UsingPreSignedUrl = async (fileName: string, preSignedUrl: string): Promise<Boolean> => {
    console.info(`saving ${fileName} to bucket ${process.env.S3_BUCKET_USER}`);
    const stream = fs.readFileSync(`./assets/${fileName}`);
    console.info(`File is being saved with length: ${Buffer.byteLength(stream)}`);
    return axios
        .put(preSignedUrl, stream, OCTET_STREAM)
        .then(res => res.status == GREAT_SUCCESS)
        .catch(error => {
            console.error(error);
            return false;
        });
};

export const retrieveFileFromS3UsingPreSignedUrl = async (fileName: string, presignedUrl: string): Promise<Boolean> => {
    console.info(`retrieving ${fileName} from bucket ${process.env.S3_BUCKET_USER}`);
    return axios
        .get(presignedUrl, {responseType: "arraybuffer"})
        .then(res => {
            console.info(`Retrieved file >>> ${Buffer.from(res.data).toString("base64").substring(0, 100)}`);
            return res.status == GREAT_SUCCESS;
        })
        .catch(error => {
            console.error(`Error retrieving file >>>`, error);
            return false;
        });
};

export const retrievePostFromDynamoDb = async (postId: string, userId: string): Promise<PostEntity> => {
    const postRepository = new PostRepository();
    let result: PostEntity;
    const start = Date.now();
    const asyncFn = async () => {
        const millis = Date.now() - start;
        return postRepository.getPost(postId, userId).then((data: PostEntity) => {
            result = data;
            return !!result || Math.floor(millis / 1000) > 10;
        }).catch(_ => false);
    };
    await polling(asyncFn, 1000);
    return result;
};

export const retrieveFileFromDynamoDb = async (fileId: string, userId: string): Promise<FileEntity> => {
    const fileRepository = new FileRepository();
    let result: FileEntity;
    const start = Date.now();
    const asyncFn = async () => {
        const millis = Date.now() - start;
        return fileRepository.getFile(fileId, userId).then((data: FileEntity) => {
            result = data;
            return !!result || Math.floor(millis / 1000) > 10;
        }).catch(_ => false);
    };
    await polling(asyncFn, 1000);
    return result;
};

export const basicAuthHeaders = (email: string, password: string) => {
    return {
        headers: {
            contentType: "application/json",
            Authorization: `Basic ${encodeBase64(`${email}:${password}`)}`
        }
    };
};

export const fileDeleted = async (fileName: string): Promise<boolean> => {
    const s3 = s3Client();
    const start = Date.now();
    const asyncFn = async () => {
        const millis = Date.now() - start;
        return s3.headObject({Key: fileName, Bucket: fileName})
            .then(_ => Math.floor(millis / 1000) > 10)
            .catch(_ => true);
    };
    await polling(asyncFn, 1000);
    return true;
};

export const retrieveFileFromDynamoDbOnCondition = async (fileId: string, userId: string, condition: (FileEntity) => boolean, waitSeconds: number): Promise<FileEntity | null> => {
    const fileRepository = new FileRepository();
    let result: FileEntity = null;
    const start = Date.now();
    const asyncFn = async () => {
        const seconds = Math.floor((Date.now() - start) / 1000);
        return fileRepository.getFile(fileId, userId).then((data: FileEntity) => {
            result = data;
            return condition(result) || seconds > waitSeconds;
        }).catch(_ => false);
    };
    await polling(asyncFn, 1000);
    return !!result && condition(result) ? result : null;
};

export const saveFileToS3 = async (fileName: string): Promise<PutObjectCommandOutput> => {
    const data = fs.readFileSync(`./assets/${fileName}`);
    console.info(`saving ${fileName} to bucket ${process.env.S3_BUCKET_USER}`);
    const result = await s3Client().putObject({Key: fileName, Bucket: process.env.S3_BUCKET_USER, Body: data});
    expect(result.$metadata.httpStatusCode).toEqual(GREAT_SUCCESS);
    return result;
};

export const createAndUploadFile = async (fileName: string, accessToken: string): Promise<CreateFileResponse> => {
    return await createFile({name: fileName}, accessToken)
        .then(async response => {
            console.log(`started upload file to s3 ${fileName}`);
            await saveFileToS3UsingPreSignedUrl(response.name, response.preSignedUrl);
            console.log(`finished upload file to s3 ${fileName}`);
            return response;
        });
};

