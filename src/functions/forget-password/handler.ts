import constraint from "@functions/forget-password/constraint";
import { formatJSONResponse } from "@libs/api-gateway";
import { exceptionResolver } from "@libs/exception-resolver";
import { middyfy } from "@libs/lambda";
import { validateAgainstConstraints } from "@libs/utils";
import { ForgetPasswordService } from "@services/forgot-password.service";
import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";

const forgetPassword: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    const body = ["dev", "test"].includes(process.env.SYS_ENV) ? event.body : JSON.parse(event.body);
    const data = {email: body.email};
    return validateAgainstConstraints(data, constraint)
        .then(_ => new ForgetPasswordService().forgetPassword(data).then(data => formatJSONResponse(200, data)))
        .catch(error => exceptionResolver(error));
};

export const main = middyfy(forgetPassword);
