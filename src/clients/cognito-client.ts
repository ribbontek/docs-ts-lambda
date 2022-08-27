import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

export const cognitoIdentityProviderClient = (): CognitoIdentityProviderClient => {
    return new CognitoIdentityProviderClient({region: process.env.AWS_REGION});
};

