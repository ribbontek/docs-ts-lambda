export interface PostEntity {
    readonly postId: string;
    readonly message: string;
    readonly privacy: PrivacyEnum;
    readonly fileIds: string[];
    readonly created: string;
    readonly updated?: string | null;
    readonly userId: string;
    readonly deleted: boolean;
}

export enum PrivacyEnum {
    ME = "me",
    EVERYONE = "everyone"
}
