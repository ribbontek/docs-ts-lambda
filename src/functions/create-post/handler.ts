import constraint from "@functions/create-post/constraint";
import { formatJSONResponse } from "@libs/api-gateway";
import { exceptionResolver } from "@libs/exception-resolver";
import { middyfy } from "@libs/lambda";
import { validateAgainstConstraints } from "@libs/utils";
import { CreatePostService } from "@services/create-post.service";
import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";

const createPost: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    const body = ["dev", "test"].includes(process.env.SYS_ENV) ? event.body : JSON.parse(event.body);
    const data = {message: body.message, fileIds: body.fileIds, privacy: body.privacy, userId: event.requestContext.authorizer["userId"]};
    return validateAgainstConstraints(data, constraint)
        .then(_ => new CreatePostService().create(data).then(data => formatJSONResponse(200, data)))
        .catch(error => exceptionResolver(error));
};

export const main = middyfy(createPost);
