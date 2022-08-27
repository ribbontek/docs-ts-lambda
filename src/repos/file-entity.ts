import { FileMetadata, TextractBlock } from "@models/file.model";

export interface FileEntity {
    readonly fileId: string;
    readonly userId: string;
    readonly name: string;
    readonly size: number;
    readonly extension: string;
    readonly uploaded: boolean;
    readonly compressed: boolean;
    readonly analyzed: boolean;
    readonly tags: string[];
    readonly deleted: boolean;
    readonly metadata: FileMetadata[];
    readonly blocks: TextractBlock[];
}
