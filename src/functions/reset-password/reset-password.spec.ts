import { UserRepository } from "@repos/user-repository";
import { AuthService } from "@services/auth.service";
import { APPLICATION_JSON, forgetPassword, GREAT_SUCCESS, loginUser, registerUser, RESET_PASSWORD_URL, s3ready } from "@test-utils/shared";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

/**
 * NOTE: No way to integration test the happy path unless manually
 */
describe("Reset Password Integration Test", () => {
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

    test(`expect failure for invalid request - invalid code`, async () => {
        const user = {
            email,
            password: process.env.TEST_PASSWORD,
            firstName: "test",
            lastName: "user"
        };
        await registerUser(user);
        await forgetPassword(email);
        const invalidRequest = {
            email,
            password: process.env.TEST_PASSWORD,
            code: "123456"
        };

        const result = await axios
            .post(RESET_PASSWORD_URL, invalidRequest, APPLICATION_JSON)
            .then(res => res.status == GREAT_SUCCESS)
            .catch(_ => false);
        expect(result).toBeFalsy(); // should return an auth exception and be false
        // verify user entity is locked
        const userEntity = await userRepository.getByEmail(email);
        expect(userEntity.email).toEqual(user.email);
        expect(userEntity.locked).toBeTruthy();
        // verify user cannot log in
        const auth = await loginUser(user.email, user.password);
        expect(auth).toBeNull();
    });

    test(`expect bad-request for invalid request`, async () => {
        const invalidRequest = {
            email: "email",
            password: "saldkdfnkndjsnfgkjsandkfj",
            code: 123456
        };

        const result: boolean = await axios
            .post(RESET_PASSWORD_URL, invalidRequest, APPLICATION_JSON)
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(400);
                expect(message).toEqual("Bad Request");
                return false;
            });
        expect(result).toBeFalsy();
    });
});


