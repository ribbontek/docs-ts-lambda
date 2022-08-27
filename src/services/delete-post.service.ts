import { handleApiError } from "@libs/utils";
import { NotFoundException } from "@models/exception.model";
import { DeletePostCommand } from "@models/post.model";
import { PostRepository } from "@repos/post-repository";

export class DeletePostService {

    constructor(private readonly postRepository = new PostRepository()) {
    }

    public delete = async (cmd: DeletePostCommand): Promise<void> => {
        return this.postRepository.getPost(cmd.postId, cmd.userId)
            .then(found => {
                if (!!found) {
                    return this.postRepository.deletePost(cmd.postId, cmd.userId);
                }
                throw new NotFoundException(`Post not found for id: ${cmd.postId}`);
            })
            .catch(error => handleApiError(error));
    };

}
