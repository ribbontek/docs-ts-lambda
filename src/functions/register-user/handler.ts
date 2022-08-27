import constraint from "@functions/register-user/constraint";
import { formatJSONResponse } from "@libs/api-gateway";
import { exceptionResolver } from "@libs/exception-resolver";
import { middyfy } from "@libs/lambda";
import { validateAgainstConstraints } from "@libs/utils";
import { RegisterUserService } from "@services/register-user.service";
import { APIGatewayEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";

const registerUser: APIGatewayProxyHandler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    const data = ["dev", "test"].includes(process.env.SYS_ENV) ? event.body : JSON.parse(event.body);;
    return validateAgainstConstraints(data, constraint)
        .then(_ => new RegisterUserService().registerUser(data).then(data => formatJSONResponse(200, data)))
        .catch(error => exceptionResolver(error));
};

export const main = middyfy(registerUser);
