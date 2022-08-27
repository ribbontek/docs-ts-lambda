import { UserRepository } from "@repos/user-repository";
import { AuthService } from "@services/auth.service";
import { APPLICATION_JSON, FORGET_PASSWORD_URL, GREAT_SUCCESS, loginUser, registerUser, s3ready } from "@test-utils/shared";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

describe("Forget Password Integration Test", () => {
    // set global timeout for jest
    jest.setTimeout(30000);

    const email = `ribbontek+${uuidv4()}@gmail.com`;
    const userRepository = new UserRepository();
    const authService = new AuthService();

    beforeAll(async () => {
        await s3ready();
    });

    afterAll(async () => {
        await authService.deleteUser(email).catch(error => console.error(error));
    });

    test(`expect success for valid request`, async () => {
        const user = {
            email,
            password: process.env.TEST_PASSWORD,
            firstName: "test",
            lastName: "user"
        };
        await registerUser(user);
        const validRequest = {email};

        const result = await axios
            .post(FORGET_PASSWORD_URL, validRequest, APPLICATION_JSON)
            .then(res => {
                return res.status == GREAT_SUCCESS;
            })
            .catch(error => {
                console.error(error);
                return false;
            });
        expect(result).toBeTruthy();
        // verify user entity is locked
        const userEntity = await userRepository.getByEmail(validRequest.email);
        expect(userEntity.email).toEqual(validRequest.email);
        expect(userEntity.locked).toBeTruthy();
        // verify user cannot log in
        const auth = await loginUser(user.email, user.password);
        expect(auth).toBeNull();
    });

    test(`expect bad-request for invalid request`, async () => {
        const invalidRequest = {email: "email"};

        const forgetPasswordResult: boolean = await axios
            .post(FORGET_PASSWORD_URL, invalidRequest, APPLICATION_JSON)
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(400);
                expect(message).toEqual("Bad Request");
                return false;
            });
        expect(forgetPasswordResult).toBeFalsy();
    });
});


