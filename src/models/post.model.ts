import { NativeAttributeValue } from "@aws-sdk/util-dynamodb";

export interface GetPostCommand {
    readonly postId: string;
    readonly userId: string;
}

export interface SearchPostCommand {
    readonly userId?: string | null;
    readonly message?: string | null;
    readonly limit: number;
    readonly lastEvaluatedKey?: Record<string, NativeAttributeValue> | null;
}

export interface CreatePostCommand {
    readonly message: string;
    readonly privacy: string;
    readonly userId: string;
    readonly fileIds: string[];
}

export interface UpdatePostCommand {
    readonly postId: string;
    readonly message: string;
    readonly privacy: string;
    readonly userId: string;
    readonly fileIds: string[];
}

export interface DeletePostCommand {
    readonly postId: string;
    readonly userId: string;
}

// tslint:disable:interface-over-type-literal
export type GetPostResponse = {
    readonly postId: string;
    readonly message: string;
    readonly privacy: string;
    readonly fileIds: string[];
    readonly created: string;
    readonly updated: string;
};

// tslint:disable:interface-over-type-literal
export type PostResponse = {
    readonly postId: string;
    readonly message: string;
    readonly privacy: string;
    readonly fileIds: string[];
    readonly created: string;
    readonly updated?: string | null;
};

// tslint:disable:interface-over-type-literal
export type SearchPostResponse = {
    readonly data: GetPostResponse[];
    readonly size: number;
    readonly total: number;
    readonly lastEvaluatedKey: Record<string, NativeAttributeValue>;
}
