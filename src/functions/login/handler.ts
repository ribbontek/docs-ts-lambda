import constraint from "@functions/login/constraint";
import { formatJSONResponse } from "@libs/api-gateway";
import { exceptionResolver } from "@libs/exception-resolver";
import { middyfy } from "@libs/lambda";
import { handleAuthError, validateAgainstConstraints, validateBasicAuth } from "@libs/utils";
import { LoginService } from "@services/login.service";
import { APIGatewayProxyResult } from "aws-lambda";

const loginUser = async (event): Promise<APIGatewayProxyResult> => {
    return validateBasicAuth(event)
        .then(data => validateAgainstConstraints(JSON.parse(JSON.stringify(data)), constraint)
            .then(_ => new LoginService().loginUser(data).then(data => formatJSONResponse(200, data)))
            .catch(error => handleAuthError(error))
        )
        .catch(error => exceptionResolver(error));
};

export const main = middyfy(loginUser);
