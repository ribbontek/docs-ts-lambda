import { handleApiError } from "@libs/utils";
import { mapCreatePostCommandToEntity, mapToPostResponse } from "@mappers/post.mapper";
import { BadRequestException } from "@models/exception.model";
import { CreatePostCommand, PostResponse } from "@models/post.model";
import { FileRepository } from "@repos/file-repository";
import { PostEntity } from "@repos/post-entity";
import { PostRepository } from "@repos/post-repository";

export class CreatePostService {

    constructor(
        private readonly postRepository = new PostRepository(),
        private readonly fileRepository = new FileRepository()
    ) {
    }

    public create = async (cmd: CreatePostCommand): Promise<PostResponse> => {
        await this.validateRequest(cmd);
        return this.postRepository.createPost(mapCreatePostCommandToEntity(cmd))
            .then((entity: PostEntity) => mapToPostResponse(entity))
            .catch(error => handleApiError(error));
    };

    private readonly validateRequest = async (cmd: CreatePostCommand): Promise<void> => {
        const foundFileIds: string[] = await Promise.all(
            cmd.fileIds.map(async (fileId) => await this.fileRepository.getFile(fileId, cmd.userId))
        ).then(files => files.filter(file => file != null).map(file => file.fileId))
            .catch(error => handleApiError(error));
        if (foundFileIds.length != cmd.fileIds.length) {
            const invalidFileIds = cmd.fileIds.filter(fileId => !foundFileIds.includes(fileId));
            console.error(`Invalid fileIds: ${invalidFileIds}`);
            throw new BadRequestException(`Invalid fileIds: ${invalidFileIds}`);
        }
    };

}
