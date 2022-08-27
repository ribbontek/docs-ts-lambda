import { handleApiError } from "@libs/utils";
import { mapToGetPostResponse } from "@mappers/post.mapper";
import { SearchPostCommand, SearchPostResponse } from "@models/post.model";
import { PagedEntity } from "@repos/paged-entity";
import { PostEntity } from "@repos/post-entity";
import { PostRepository } from "@repos/post-repository";

export class SearchPostsService {
    
    constructor(private readonly postRepository = new PostRepository()) {
    }

    public search = async (cmd: SearchPostCommand): Promise<SearchPostResponse> => {
        return this.postRepository.searchPosts(cmd)
            .then(output => this.mapToSearchPostsResponse(output))
            .catch(error => handleApiError(error));
    };

    private readonly mapToSearchPostsResponse = (pagedEntity?: PagedEntity<PostEntity> | null): SearchPostResponse => {
        return !!pagedEntity ? {
            data: pagedEntity.data.map(entity => mapToGetPostResponse(entity)),
            lastEvaluatedKey: pagedEntity.lastEvaluatedKey,
            size: pagedEntity.size,
            total: pagedEntity.total
        } : {
            data: [],
            lastEvaluatedKey: null,
            size: 0,
            total: 0
        };
    };
}
