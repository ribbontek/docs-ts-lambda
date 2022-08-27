import { Readable } from "stream";

export interface GetFileCommand {
    readonly fileId: string;
    readonly userId: string;
}

export interface CreateFileCommand {
    readonly name: string;
    readonly userId: string;
}

export interface DeleteFileCommand {
    readonly fileId: string;
    readonly userId: string;
}

export interface ProcessFileCompressedResult {
    readonly userId: string;
    readonly name: string;
    readonly size: number;
    readonly metadata: FileMetadata[];
}

export class FileMetadata {
    originalHeight?: number | null;
    originalWidth?: number | null;
    audioCodec?: string | null;
    videoCodec?: string | null;
    duration?: string | null;
    newHeight: number;
    newWidth: number;
    newSize: number;
    newName: string;
    mimeType: string;
}

export class TextractFile {
    buffer: Buffer;
    blocks: TextractBlock[];

    constructor(buffer: Buffer, blocks: TextractBlock[]) {
        this.buffer = buffer;
        this.blocks = blocks;
    }
}

export interface TextractBlock {
    confidence: number;
    blockType: string;
    text: string;
    textType: string;
}

// tslint:disable:interface-over-type-literal
export type GetFileResponse = {
    readonly fileId: string;
    readonly name: string;
    readonly size: number;
    readonly extension: string;
    readonly tags: string[];
    readonly uploaded: boolean;
    readonly analyzed: boolean;
    readonly compressed: boolean;
    readonly preSignedUrl: string;
    readonly metadata: FileMetadataResponse[];
    readonly blocks: TextractBlockResponse[];
    readonly preSignedUrlForAnalyzed: string | null;
};

export type FileMetadataResponse = {
    originalHeight?: number | null;
    originalWidth?: number | null;
    audioCodec?: string | null;
    videoCodec?: string | null;
    duration?: string | null;
    newHeight: number;
    newWidth: number;
    newSize: number;
    newName: string;
    mimeType: string;
    preSignedUrl: string | null;
}

export type TextractBlockResponse = {
    confidence: number;
    blockType: string;
    text: string;
    textType: string;
}

// tslint:disable:interface-over-type-literal
export type CreateFileResponse = {
    readonly fileId: string;
    readonly name: string;
    readonly preSignedUrl: string;
};

export interface S3File extends S3FileMetadata {
    readonly key: string;
    readonly contents: Readable;
}

export interface S3FileMetadata {
    readonly length: number;
}
