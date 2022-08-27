import { VerifyTokenService } from "@services/verify-token.service";
import { APIGatewayAuthorizerEvent, APIGatewayAuthorizerResult, Callback, Context } from "aws-lambda";

const verifyToken = async (event: APIGatewayAuthorizerEvent, _: Context, callback: Callback): Promise<APIGatewayAuthorizerResult | void> => {
    return new VerifyTokenService().verifyToken(event)
        .catch(_ => callback("Unauthorized"));
};

export const main = verifyToken;
