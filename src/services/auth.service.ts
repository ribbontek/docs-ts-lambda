import {
    AdminCreateUserCommand,
    AdminCreateUserCommandOutput,
    AdminDeleteUserCommand,
    AdminDeleteUserCommandOutput,
    AdminGetUserCommand,
    AdminGetUserCommandOutput,
    AdminSetUserPasswordCommand,
    AdminSetUserPasswordCommandOutput,
    AuthFlowType,
    ConfirmForgotPasswordCommand,
    ForgotPasswordCommand,
    ForgotPasswordCommandOutput,
    InitiateAuthCommand,
    InitiateAuthCommandOutput
} from "@aws-sdk/client-cognito-identity-provider";
import { AuthenticationResultType } from "@aws-sdk/client-cognito-identity-provider/dist-types/models/models_0";
import { cognitoIdentityProviderClient } from "@clients/cognito-client";
import { handleAuthError } from "@libs/utils";
import { AuthCommand, CognitoUserDetails, ForgetPasswordCommand, ResetPasswordCommand } from "@models/auth.model";
import { UserEntity } from "@repos/user-entity";
import { createHmac } from "crypto";

export class AuthService {

    constructor(private readonly cognitoClient = cognitoIdentityProviderClient()) {
    }

    public registerUser = (cmd: AuthCommand): Promise<CognitoUserDetails> => {
        return this.createUser(cmd)
            .then(data => this.registerPassword(cmd).catch(error => this.handleRegisterPasswordErrorForOutput(data, error)))
            .catch(error => handleAuthError(error));
    };

    public registerPasswordForCreatedUser = (cmd: AuthCommand, userEntity: UserEntity): Promise<CognitoUserDetails> => {
        return this.setUserPassword(cmd)
            .then(_ => this.getUser(cmd.email).then(user => this.mapUserToCognitoUserDetails(user)))
            .catch(error => this.handleRegisterPasswordError(userEntity, error));
    };

    public login = async (cmd: AuthCommand): Promise<AuthenticationResultType> => {
        return this.initiateAuth(cmd)
            .then(data => data.AuthenticationResult)
            .catch(error => handleAuthError(error));
    };

    public forgetPasswordForUser = async (cmd: ForgetPasswordCommand): Promise<CognitoUserDetails> => {
        return this.forgotPassword(cmd)
            .then(_ => this.getUser(cmd.email).then(user => this.mapUserToCognitoUserDetails(user)))
            .catch(error => handleAuthError(error));
    };

    public resetPasswordForUser = async (cmd: ResetPasswordCommand): Promise<CognitoUserDetails> => {
        return this.resetPassword(cmd)
            .then(_ => this.getUser(cmd.email).then(user => this.mapUserToCognitoUserDetails(user)))
            .catch(error => handleAuthError(error));
    };

    public deleteUser: (email: string) => Promise<AdminDeleteUserCommandOutput | void> = async (email: string) => {
        return this.deleteUserFn(email).catch(error => handleAuthError(error));
    };

    private readonly registerPassword = async (cmd: AuthCommand): Promise<CognitoUserDetails> => {
        return this.setUserPassword(cmd)
            .then(_ => this.getUser(cmd.email).then(user => this.mapUserToCognitoUserDetails(user)));
    };

    private readonly forgotPassword = async (cmd: ForgetPasswordCommand): Promise<null> => {
        return this.forgotPasswordFn(cmd.email)
            .then(_ => null)
            .catch(error => handleAuthError(error));
    };

    private readonly resetPassword = async (cmd: ResetPasswordCommand): Promise<null> => {
        return this.resetPasswordFn(cmd.email, cmd.password, cmd.code)
            .then(_ => null)
            .catch(error => handleAuthError(error));
    };

    private readonly handleRegisterPasswordError = (entity: UserEntity, error: Error): CognitoUserDetails => {
        console.error(`Auth Error: ${error.message}`);
        return {
            username: entity.idpUserName,
            status: entity.idpStatus,
            errorMessage: error.message
        };
    };

    private readonly handleRegisterPasswordErrorForOutput = (output: AdminCreateUserCommandOutput, error: Error): CognitoUserDetails => {
        console.error(`Auth Error: ${error.message}`);
        return {
            username: output.User.Username,
            status: output.User.UserStatus,
            errorMessage: error.message
        };
    };

    private readonly mapUserToCognitoUserDetails = (output: AdminGetUserCommandOutput): CognitoUserDetails => {
        return {
            username: output.Username,
            status: output.UserStatus
        };
    };

    private readonly getUser = (email: string): Promise<AdminGetUserCommandOutput> => {
        return this.cognitoClient.send(
            new AdminGetUserCommand(
                {
                    UserPoolId: process.env.USER_POOL_ID,
                    Username: email
                }
            )
        );
    };

    private readonly createUser = (cmd: AuthCommand): Promise<AdminCreateUserCommandOutput> => {
        return this.cognitoClient.send(
            new AdminCreateUserCommand(
                {
                    UserPoolId: process.env.USER_POOL_ID,
                    Username: cmd.email,
                    MessageAction: "SUPPRESS",
                    ForceAliasCreation: false,
                    UserAttributes: [
                        {Name: "email", Value: cmd.email},
                        {Name: "email_verified", Value: "true"}
                    ]
                }
            )
        );
    };

    private readonly deleteUserFn = (email: string): Promise<AdminDeleteUserCommandOutput> => {
        return this.cognitoClient.send(
            new AdminDeleteUserCommand(
                {
                    UserPoolId: process.env.USER_POOL_ID,
                    Username: email
                }
            )
        );
    };

    private readonly setUserPassword = (cmd: AuthCommand): Promise<AdminSetUserPasswordCommandOutput> => {
        return this.cognitoClient.send(
            new AdminSetUserPasswordCommand(
                {
                    UserPoolId: process.env.USER_POOL_ID,
                    Username: cmd.email,
                    Password: cmd.password,
                    Permanent: true
                }
            )
        );
    };

    private readonly initiateAuth = (cmd: AuthCommand): Promise<InitiateAuthCommandOutput> => {
        return this.cognitoClient.send(
            new InitiateAuthCommand(
                {
                    ClientId: process.env.APP_CLIENT_ID,
                    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
                    AuthParameters: {
                        "USERNAME": cmd.email,
                        "PASSWORD": cmd.password,
                        "SECRET_HASH": this.secretHash(cmd.email),
                    }
                }
            )
        );
    };

    private readonly forgotPasswordFn = (email: string): Promise<ForgotPasswordCommandOutput> => {
        return this.cognitoClient.send(
            new ForgotPasswordCommand(
                {
                    Username: email,
                    ClientId: process.env.APP_CLIENT_ID,
                    SecretHash: this.secretHash(email)
                }
            )
        ).then(data => {
            console.log(JSON.stringify(data));
            return data;
        });
    };

    private readonly resetPasswordFn = (email: string, password: string, code: string): Promise<ForgotPasswordCommandOutput> => {
        return this.cognitoClient.send(
            new ConfirmForgotPasswordCommand(
                {
                    Username: email,
                    Password: password,
                    ClientId: process.env.APP_CLIENT_ID,
                    SecretHash: this.secretHash(email),
                    ConfirmationCode: code
                }
            )
        ).then(data => {
            console.log(JSON.stringify(data));
            return data;
        });
    };

    private readonly secretHash = (username: string): string => {
        return createHmac("sha256", process.env.APP_CLIENT_SECRET)
            .update(`${username}${process.env.APP_CLIENT_ID}`)
            .digest("base64");
    };

}
