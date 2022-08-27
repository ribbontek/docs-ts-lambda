import constraint from "@functions/get-file/constraint";
import { formatJSONResponse } from "@libs/api-gateway";
import { exceptionResolver } from "@libs/exception-resolver";
import { middyfy } from "@libs/lambda";
import { validateAgainstConstraints } from "@libs/utils";
import { GetFileService } from "@services/get-file.service";
import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";

const getFile: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    const {fileId} = event.pathParameters;
    const data = {fileId, userId: event.requestContext.authorizer["userId"]};
    console.info(JSON.stringify(data))
    return validateAgainstConstraints(data, constraint)
        .then(_ => new GetFileService().getFile(data).then(data => formatJSONResponse(200, data)))
        .catch(error => exceptionResolver(error));
};

export const main = middyfy(getFile);
