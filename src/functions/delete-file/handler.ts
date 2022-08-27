import constraint from "@functions/delete-file/constraint";
import { formatJSONResponse } from "@libs/api-gateway";
import { exceptionResolver } from "@libs/exception-resolver";
import { middyfy } from "@libs/lambda";
import { validateAgainstConstraints } from "@libs/utils";
import { DeleteFileService } from "@services/delete-file.service";
import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";

const deleteFile: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    const {fileId} = event.pathParameters;
    const data = {fileId, userId: event.requestContext.authorizer["userId"]};
    return validateAgainstConstraints(data, constraint)
        .then(_ => new DeleteFileService().delete(data).then(_ => formatJSONResponse(200, {})))
        .catch(error => exceptionResolver(error));
};

export const main = middyfy(deleteFile);
