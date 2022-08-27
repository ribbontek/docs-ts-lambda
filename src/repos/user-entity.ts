export interface UserEntity {
    readonly userId: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly idpUserName: string;
    readonly idpStatus: string;
    readonly deleted: boolean;
    readonly locked: boolean;
}
