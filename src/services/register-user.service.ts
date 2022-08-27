import { handleAuthError } from "@libs/utils";
import { mapToRegisterUserResponse } from "@mappers/auth.mapper";
import { mapRegisterUserCommandToEntity } from "@mappers/user.mapper";
import { AuthCommand, CognitoUserDetails, RegisterUserCommand, RegisterUserResponse } from "@models/auth.model";
import { UserEntity } from "@repos/user-entity";
import { UserRepository } from "@repos/user-repository";
import { AuthService } from "@services/auth.service";

export class RegisterUserService {

    constructor(
        private readonly userRepository = new UserRepository(),
        private readonly authService = new AuthService()
    ) {
    }

    public registerUser = async (cmd: RegisterUserCommand): Promise<RegisterUserResponse> => {
        const user = await this.userRepository.getByEmail(cmd.email);
        return this.registerUserOrPasswordForCreatedUser({email: cmd.email, password: cmd.password}, user)
            .then(data => this.createUpdateUserEntity(cmd, data))
            .catch(error => handleAuthError(error));
    };

    private readonly registerUserOrPasswordForCreatedUser = (
        cmd: AuthCommand,
        entity?: UserEntity | null
    ): Promise<CognitoUserDetails> => {
        return (!!entity && entity.idpStatus == "FORCE_CHANGE_PASSWORD")
            ? this.authService.registerPasswordForCreatedUser({email: cmd.email, password: cmd.password}, entity)
            : this.authService.registerUser({email: cmd.email, password: cmd.password});
    };

    private readonly createUpdateUserEntity = (
        cmd: RegisterUserCommand,
        data: CognitoUserDetails,
        entity?: UserEntity | null
    ): Promise<RegisterUserResponse> => {
        if (!!entity && data.status == "FORCE_CHANGE_PASSWORD" || !!data.errorMessage) {
            return this.createOrUpdate(cmd, data, entity)
                .then(_ => handleAuthError(Error(data.errorMessage)));
        } else {
            return this.createOrUpdate(cmd, data, entity)
                .then(data => mapToRegisterUserResponse(data));
        }
    };

    private readonly createOrUpdate = (
        cmd: RegisterUserCommand,
        data: CognitoUserDetails,
        entity?: UserEntity | null
    ): Promise<UserEntity> => {
        return (!!entity)
            ? this.userRepository.update(mapRegisterUserCommandToEntity(data, cmd, entity))
            : this.userRepository.create(mapRegisterUserCommandToEntity(data, cmd, entity));
    };

}
