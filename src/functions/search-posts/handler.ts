import constraint from "@functions/search-posts/constraint";
import { formatJSONResponse } from "@libs/api-gateway";
import { exceptionResolver } from "@libs/exception-resolver";
import { middyfy } from "@libs/lambda";
import { validateAgainstConstraints } from "@libs/utils";
import { SearchPostsService } from "@services/search-posts.service";
import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";

const searchPosts: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    const body = ["dev", "test"].includes(process.env.SYS_ENV) ? event.body : JSON.parse(event.body);
    const data = {limit: body.limit, message: body.message, lastEvaluatedKey: body.lastEvaluatedKey, userId: body.userId};
    return validateAgainstConstraints(data, constraint)
        .then(_ => new SearchPostsService().search(data).then(data => formatJSONResponse(200, data)))
        .catch(error => exceptionResolver(error));
};

export const main = middyfy(searchPosts);
