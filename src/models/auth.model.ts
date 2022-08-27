export interface AuthCommand {
    readonly email: string;
    readonly password: string;
}

export interface RegisterUserCommand {
    readonly email: string;
    readonly password: string;
    readonly firstName: string;
    readonly lastName: string;
}

export interface ForgetPasswordCommand {
    readonly email: string;
}

export interface ResetPasswordCommand {
    readonly email: string;
    readonly password: string;
    readonly code: string;
}

export interface LoginUserCommand {
    readonly email: string;
    readonly password: string;
}

export type RegisterUserResponse = {
    readonly userId: string;
    readonly email: string;
};

export type LoginUserResponse = {
    readonly idToken: string;
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly expiresIn: number;
    readonly tokenType: string;
};

export interface CognitoUserDetails {
    readonly username: string;
    readonly status: string;
    readonly errorMessage?: string | null;
}
