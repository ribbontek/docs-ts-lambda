import { CreatePostCommand, GetPostResponse, PostResponse, UpdatePostCommand } from "@models/post.model";
import { PostEntity, PrivacyEnum } from "@repos/post-entity";
import { v4 as uuidv4 } from "uuid";

export const mapCreatePostCommandToEntity = (createPost: CreatePostCommand): PostEntity => {
    return {
        postId: uuidv4(),
        userId: createPost.userId,
        message: createPost.message,
        privacy: createPost.privacy as PrivacyEnum,
        fileIds: createPost.fileIds,
        created: new Date().toISOString(),
        updated: null,
        deleted: false,
    };
};

export const mapUpdatePostCommandToEntity = (updatePost: UpdatePostCommand): PostEntity => {
    return {
        postId: updatePost.postId,
        userId: updatePost.userId,
        message: updatePost.message,
        privacy: updatePost.privacy as PrivacyEnum,
        fileIds: updatePost.fileIds,
        created: new Date().toISOString(), // not updated
        updated: new Date().toISOString(),
        deleted: false, // not updated
    };
};

export const mapToPostResponse = (entity: PostEntity): PostResponse => {
    return {
        postId: entity.postId,
        message: entity.message,
        privacy: entity.privacy,
        fileIds: entity.fileIds,
        created: entity.created,
        updated: entity.updated
    };
};

export const mapToGetPostResponse = (entity: PostEntity): GetPostResponse => {
    return {
        postId: entity.postId,
        message: entity.message,
        privacy: entity.privacy,
        fileIds: entity.fileIds,
        created: entity.created,
        updated: entity.updated
    };
};
