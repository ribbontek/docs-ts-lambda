import { handleApiError } from "@libs/utils";
import { mapToGetPostResponse } from "@mappers/post.mapper";
import { NotFoundException } from "@models/exception.model";
import { GetPostCommand, GetPostResponse } from "@models/post.model";
import { PostRepository } from "@repos/post-repository";

export class GetPostService {
    
    constructor(private readonly postRepository = new PostRepository()) {
    }

    public get = async (cmd: GetPostCommand): Promise<GetPostResponse> => {
        return this.postRepository.getPost(cmd.postId, cmd.userId)
            .then(output => {
                if (!!output) {
                    return mapToGetPostResponse(output);
                }
                throw new NotFoundException(`Post not found for id: ${cmd.postId}`);
            })
            .catch(error => handleApiError(error));
    };

}
