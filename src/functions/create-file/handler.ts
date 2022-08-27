import constraint from "@functions/create-file/constraint";
import { formatJSONResponse } from "@libs/api-gateway";
import { exceptionResolver } from "@libs/exception-resolver";
import { middyfy } from "@libs/lambda";
import { validateAgainstConstraints } from "@libs/utils";
import { CreateFileService } from "@services/create-file.service";
import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";

const createFile: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    const body = ["dev", "test"].includes(process.env.SYS_ENV) ? event.body : JSON.parse(event.body);
    const data = {name: body.name, userId: event.requestContext.authorizer["userId"]};
    return validateAgainstConstraints(data, constraint)
        .then(_ => new CreateFileService().create(data).then(data => formatJSONResponse(200, data)))
        .catch(error => exceptionResolver(error));
};

export const main = middyfy(createFile);
