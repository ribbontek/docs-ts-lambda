import constraint from "@functions/reset-password/constraint";
import { formatJSONResponse } from "@libs/api-gateway";
import { exceptionResolver } from "@libs/exception-resolver";
import { middyfy } from "@libs/lambda";
import { validateAgainstConstraints } from "@libs/utils";
import { ResetPasswordService } from "@services/reset-password.service";
import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";

const resetPassword: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    const body = ["dev", "test"].includes(process.env.SYS_ENV) ? event.body : JSON.parse(event.body);
    const data = {email: body.email, password: body.password, code: body.code};
    return validateAgainstConstraints(data, constraint)
        .then(_ => new ResetPasswordService().resetPassword(data).then(data => formatJSONResponse(200, data)))
        .catch(error => exceptionResolver(error));
};

export const main = middyfy(resetPassword);
