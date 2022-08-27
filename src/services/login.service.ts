import { handleAuthError } from "@libs/utils";
import { mapToLoginUserResponse } from "@mappers/auth.mapper";
import { LoginUserCommand, LoginUserResponse } from "@models/auth.model";
import { UserRepository } from "@repos/user-repository";
import { AuthService } from "@services/auth.service";

export class LoginService {

    constructor(
        private readonly userRepository = new UserRepository(),
        private readonly authService = new AuthService()
    ) {
    }

    public loginUser = async (cmd: LoginUserCommand): Promise<LoginUserResponse> => {
        if (!await this.userRepository.existsByEmail(cmd.email)) {
            handleAuthError(Error("User does not exist in repository"));
        }
        return this.authService.login({email: cmd.email, password: cmd.password})
            .then(data => mapToLoginUserResponse(data))
            .catch(error => handleAuthError(error));
    };

}
