import { RegisterUserResponse } from "@models/auth.model";
import { UserRepository } from "@repos/user-repository";
import { AuthService } from "@services/auth.service";
import { APPLICATION_JSON, GREAT_SUCCESS, s3ready, USER_REGISTER_URL } from "@test-utils/shared";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

describe("Register User Integration Test", () => {
    // set global timeout for jest
    jest.setTimeout(30000);

    const email = `ribbontek+${uuidv4()}@gmail.com`;
    const userRepository = new UserRepository();

    beforeAll(async () => {
        await s3ready();
    });

    afterAll(async () => {
        await new AuthService().deleteUser(email).catch(error => console.error(error));
    });

    test(`expect success for valid request`, async () => {
        const validRequest = {
            email,
            password: process.env.TEST_PASSWORD,
            firstName: "test",
            lastName: "user"
        };

        const registerUserResponse: RegisterUserResponse | null = await axios
            .post(USER_REGISTER_URL, validRequest, APPLICATION_JSON)
            .then(res => {
                console.info(JSON.stringify(res.data));
                return res.data as RegisterUserResponse;
            })
            .catch(error => {
                console.error(error);
                return null;
            });
        expect(registerUserResponse).not.toBeNull();
        const userEntity = await userRepository.getByUserId(registerUserResponse.userId);
        expect(userEntity.email).toEqual(registerUserResponse.email);
    });

    test(`expect bad-request for invalid request`, async () => {
        const validRequest = {
            email: "email",
            password: "saldkdfnkndjsnfgkjsandkfj",
            firstName: "test",
            lastName: "user"
        };

        const registerUserResponse: boolean = await axios
            .post(USER_REGISTER_URL, validRequest, APPLICATION_JSON)
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(400);
                expect(message).toEqual("Bad Request");
                return false;
            });
        expect(registerUserResponse).toBeFalsy();
    });
});


