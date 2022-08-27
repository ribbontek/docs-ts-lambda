import { AuthenticationResultType } from "@aws-sdk/client-cognito-identity-provider/dist-types/models/models_0";
import { LoginUserResponse, RegisterUserResponse } from "@models/auth.model";
import { UserEntity } from "@repos/user-entity";

export const mapToRegisterUserResponse = (entity: UserEntity): RegisterUserResponse => {
    return {
        userId: entity.userId,
        email: entity.email
    };
};

export const mapToLoginUserResponse = (data: AuthenticationResultType): LoginUserResponse => {
    return {
        idToken: data.IdToken,
        accessToken: data.AccessToken,
        refreshToken: data.RefreshToken,
        expiresIn: data.ExpiresIn,
        tokenType: data.TokenType
    };
};
