import { handleApiError } from "@libs/utils";
import { mapToPostResponse, mapUpdatePostCommandToEntity } from "@mappers/post.mapper";
import { NotFoundException } from "@models/exception.model";
import { PostResponse, UpdatePostCommand } from "@models/post.model";
import { PostEntity } from "@repos/post-entity";
import { PostRepository } from "@repos/post-repository";

export class UpdatePostService {
    
    constructor(private readonly postRepository = new PostRepository()) {
    }

    public update = async (cmd: UpdatePostCommand): Promise<PostResponse> => {
        return this.postRepository.getPost(cmd.postId, cmd.userId)
            .then(found => {
                if (!!found) {
                    return this.postRepository.updatePost(mapUpdatePostCommandToEntity(cmd))
                        .then((entity: PostEntity) => mapToPostResponse(entity));
                }
                throw new NotFoundException(`Post not found for id: ${cmd.postId}`);
            })
            .catch(error => handleApiError(error));
    };

}
