import constraint from "@functions/update-post/constraint";
import { formatJSONResponse } from "@libs/api-gateway";
import { exceptionResolver } from "@libs/exception-resolver";
import { middyfy } from "@libs/lambda";
import { validateAgainstConstraints } from "@libs/utils";
import { UpdatePostService } from "@services/update-post.service";
import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";

const updatePost: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    const body = ["dev", "test"].includes(process.env.SYS_ENV) ? event.body : JSON.parse(event.body);
    const data = {postId: body.postId, message: body.message, fileIds: body.fileIds, privacy: body.privacy, userId: event.requestContext.authorizer["userId"]};
    return validateAgainstConstraints(data, constraint)
        .then(_ => new UpdatePostService().update(data).then(data => formatJSONResponse(200, data)))
        .catch(error => exceptionResolver(error));
};

export const main = middyfy(updatePost);
