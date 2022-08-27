import { handleAuthError } from "@libs/utils";
import { UserRepository } from "@repos/user-repository";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { APIGatewayAuthorizerEvent, PolicyDocument } from "aws-lambda";
import { APIGatewayAuthorizerResult } from "aws-lambda/trigger/api-gateway-authorizer";

export class VerifyTokenService {

    constructor(
        private userRepository = new UserRepository(),
        private readonly verifier = CognitoJwtVerifier.create(
            {
                userPoolId: process.env.USER_POOL_ID,
                tokenUse: "access",
                clientId: process.env.APP_CLIENT_ID,
            }
        )
    ) {
    }

    public verifyToken = async (event: APIGatewayAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
        return this.verifier.verify(this.retrieveToken(event))
            .then((data) => this.authContext(data.sub, data.scope, event))
            .catch(error => handleAuthError(error));
    };

    private readonly authContext = async (sub: string, scope: string, event: APIGatewayAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
        const entity = await this.userRepository.getByIdpUserName(sub);
        return {
            principalId: sub,
            policyDocument: this.getPolicyDocument("Allow", event.methodArn),
            context: {scope: scope, userId: entity.userId}
        };
    };

    private readonly getPolicyDocument = (effect: string, resource: string): PolicyDocument => {
        return {
            Version: "2012-10-17",
            Statement: [{
                Action: "execute-api:Invoke",
                Effect: effect,
                Resource: resource,
            }]
        };
    };

    private readonly retrieveToken = (event: APIGatewayAuthorizerEvent): string => {
        if (!event.type || event.type !== "TOKEN") {
            throw new Error("Expected \"event.type\" parameter to have value \"TOKEN\"");
        }

        const tokenString = event.authorizationToken;
        if (!tokenString) {
            throw new Error("Expected \"event.authorizationToken\" parameter to be set");
        }

        const match = tokenString.match(/^Bearer (.*)$/);
        if (!match || match.length < 2) {
            throw new Error(`Invalid Authorization token - ${tokenString} does not match "Bearer .*"`);
        }
        return match[1];
    };
}
