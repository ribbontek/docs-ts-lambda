import { handleAuthError } from "@libs/utils";
import { mapCognitoUserDetailsToEntityLocked } from "@mappers/user.mapper";
import { CognitoUserDetails, RegisterUserResponse, ResetPasswordCommand } from "@models/auth.model";
import { UserEntity } from "@repos/user-entity";
import { UserRepository } from "@repos/user-repository";
import { AuthService } from "@services/auth.service";

export class ResetPasswordService {

    constructor(
        private readonly userRepository: UserRepository = new UserRepository(),
        private readonly authService: AuthService = new AuthService()
    ) {
    }

    public resetPassword = async (cmd: ResetPasswordCommand): Promise<null> => {
        return this.userRepository.getByEmail(cmd.email)
            .then(user => this.resetPasswordCognito(cmd, user)
                .then(data => this.updateUserEntity(data, user))
                .then(_ => null)
            )
            .catch(error => handleAuthError(error));
    };

    private readonly resetPasswordCognito = (
        cmd: ResetPasswordCommand,
        entity?: UserEntity | null
    ): Promise<CognitoUserDetails> => {
        if (!!entity) {
            return this.authService.resetPasswordForUser(cmd);
        } else {
            handleAuthError(Error(`Could not find user with email ${cmd.email}`));
        }
    };

    private readonly updateUserEntity = (data: CognitoUserDetails, entity: UserEntity): Promise<RegisterUserResponse> => {
        return this.userRepository.updateWithLock(mapCognitoUserDetailsToEntityLocked(data, entity, false));
    };
}
