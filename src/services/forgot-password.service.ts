import { handleAuthError } from "@libs/utils";
import { mapCognitoUserDetailsToEntityLocked } from "@mappers/user.mapper";
import { CognitoUserDetails, ForgetPasswordCommand, RegisterUserResponse } from "@models/auth.model";
import { UserEntity } from "@repos/user-entity";
import { UserRepository } from "@repos/user-repository";
import { AuthService } from "@services/auth.service";

export class ForgetPasswordService {

    constructor(
        private readonly userRepository: UserRepository = new UserRepository(),
        private readonly authService: AuthService = new AuthService()
    ) {
    }

    public forgetPassword = async (cmd: ForgetPasswordCommand): Promise<null> => {
        return this.userRepository.getByEmail(cmd.email)
            .then(user => this.forgetPasswordCognito({email: cmd.email}, user)
                .then(data => this.updateUserEntity(data, user))
                .then(_ => null)
            )
            .catch(error => handleAuthError(error));
    };

    private readonly forgetPasswordCognito = (
        cmd: ForgetPasswordCommand,
        entity?: UserEntity | null
    ): Promise<CognitoUserDetails> => {
        if (!!entity) {
            return this.authService.forgetPasswordForUser(cmd);
        } else {
            handleAuthError(Error(`Could not find user with email ${cmd.email}`));
        }
    };

    private readonly updateUserEntity = (data: CognitoUserDetails, entity: UserEntity): Promise<RegisterUserResponse> => {
        return this.userRepository.updateWithLock(mapCognitoUserDetailsToEntityLocked(data, entity, true));
    };
}
