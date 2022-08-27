import { LoginUserResponse, RegisterUserCommand } from "@models/auth.model";
import { AuthService } from "@services/auth.service";
import { APPLICATION_JSON, basicAuthHeaders, GREAT_SUCCESS, registerUser, s3ready, USER_LOGIN_URL } from "@test-utils/shared";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

describe("Login Integration Test", () => {
    // set global timeout for jest
    jest.setTimeout(30000);

    let registerUserCmd: RegisterUserCommand
    beforeAll(async () => {
        await s3ready();
        registerUserCmd = {
            email: `ribbontek+${uuidv4()}@gmail.com`,
            password: process.env.TEST_PASSWORD,
            firstName: "test",
            lastName: "user"
        };
        const setUpUser = await registerUser(registerUserCmd);
        expect(setUpUser).not.toBeNull();
    });

    afterAll(async () => {
        await new AuthService().deleteUser(registerUserCmd.email).catch(error => console.error(error));
    });

    test(`expect success for valid request`, async () => {
        const validRequest = {
            email: registerUserCmd.email,
            password: registerUserCmd.password
        };

        const loginUserResponse: LoginUserResponse | null = await axios
            .post(USER_LOGIN_URL, {}, basicAuthHeaders(validRequest.email, validRequest.password))
            .then(res => {
                console.info(JSON.stringify(res.data));
                return res.data as LoginUserResponse;
            })
            .catch(error => {
                console.error(error);
                return null;
            });
        expect(loginUserResponse).not.toBeNull();
    });

    test(`expect failure for invalid request`, async () => {
        const validRequest = {email: registerUserCmd.email, password: 'asdf'};
        const requestResult: boolean = await axios
            .post(USER_LOGIN_URL, {}, basicAuthHeaders(validRequest.email, validRequest.password))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(401);
                expect(message).toEqual("Invalid Authentication Attempt");
                return false;
            });
        expect(requestResult).toBeFalsy();

        const validRequest2 = {email: "asdkfj", password: registerUserCmd.password};
        const requestResult2: boolean = await axios
            .post(USER_LOGIN_URL, {}, basicAuthHeaders(validRequest2.email, validRequest2.password))
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(401);
                expect(message).toEqual("Invalid Authentication Attempt");
                return false;
            });
        expect(requestResult2).toBeFalsy();
    });

    test(`expect failure without basic auth`, async () => {
        const requestResult: boolean = await axios
            .post(USER_LOGIN_URL, {}, APPLICATION_JSON)
            .then(res => res.status == GREAT_SUCCESS)
            .catch(error => {
                const {message} = error.response.data;
                expect(error.response.status).toEqual(401);
                expect(message).toEqual("Invalid Authentication Attempt");
                return false;
            });
        expect(requestResult).toBeFalsy();
    });

});


