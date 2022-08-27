import constraint from "@functions/get-post/constraint";
import { formatJSONResponse } from "@libs/api-gateway";
import { exceptionResolver } from "@libs/exception-resolver";
import { middyfy } from "@libs/lambda";
import { validateAgainstConstraints } from "@libs/utils";
import { GetPostService } from "@services/get-post.service";
import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";

const getPost: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    const {postId} = event.pathParameters;
    const data = {postId, userId: event.requestContext.authorizer["userId"]};
    return validateAgainstConstraints(data, constraint)
        .then(_ => new GetPostService().get(data).then(data => formatJSONResponse(200, data)))
        .catch(error => exceptionResolver(error));
};

export const main = middyfy(getPost);
