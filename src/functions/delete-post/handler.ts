import constraint from "@functions/delete-post/constraint";
import { formatJSONResponse } from "@libs/api-gateway";
import { exceptionResolver } from "@libs/exception-resolver";
import { middyfy } from "@libs/lambda";
import { validateAgainstConstraints } from "@libs/utils";
import { DeletePostService } from "@services/delete-post.service";
import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";

const deletePost: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    const {postId} = event.pathParameters;
    const data = {postId, userId: event.requestContext.authorizer["userId"]};
    return validateAgainstConstraints(data, constraint)
        .then(_ => new DeletePostService().delete(data).then(_ => formatJSONResponse(200, {})))
        .catch(error => exceptionResolver(error));
};

export const main = middyfy(deletePost);
