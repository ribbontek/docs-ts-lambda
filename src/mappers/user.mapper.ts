import { CognitoUserDetails, RegisterUserCommand } from "@models/auth.model";
import { UserEntity } from "@repos/user-entity";
import { v4 as uuidv4 } from "uuid";

export const mapRegisterUserCommandToEntity = (
    data: CognitoUserDetails,
    cmd: RegisterUserCommand,
    entity?: UserEntity | null
): UserEntity => {
    return {
        userId: !!entity ? entity.userId : uuidv4(),
        email: !!entity ? entity.email : cmd.email,
        firstName: cmd.firstName,
        lastName: cmd.lastName,
        idpUserName: data.username,
        idpStatus: data.status,
        deleted: false,
        locked: false
    };
};

export const mapCognitoUserDetailsToEntityLocked = (
    data: CognitoUserDetails,
    entity: UserEntity,
    locked: boolean
): UserEntity => {
    return {
        userId: entity.userId,
        email: entity.email,
        firstName: entity.firstName,
        lastName: entity.lastName,
        idpUserName: data.username,
        idpStatus: data.status,
        deleted: false,
        locked: locked
    };
};

