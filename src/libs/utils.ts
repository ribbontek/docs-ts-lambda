import { setUpCustomValidators } from "@libs/validate-ext";
import videoFormatToMimetype from "@libs/video-format-to-mimetype";
import { LoginUserCommand } from "@models/auth.model";
import { AlreadyExistsException, ApiException, AuthException, NotFoundException } from "@models/exception.model";
import * as Jimp from "jimp";
import { validate } from "validate.js";

export const handleRepoError = (error: Error) => {
    console.error(`Error: ${error.message}`);
    throw new Error(`Error: ${error.message}`);
};

export const handleAuthError = (error: Error) => {
    if (error instanceof AuthException) {
        throw error;
    } else {
        throw authError(error);
    }
};

const authError = (error: Error): AuthException => {
    console.error(`Auth Error: ${error.message}`);
    return new AuthException("Invalid Authentication Attempt");
};

export const handleApiError = (error: Error) => {
    if (error instanceof NotFoundException
        || error instanceof AlreadyExistsException
        || error instanceof ApiException) {
        throw error;
    } else {
        console.error(`Api Exception Error: ${error.message}`);
        throw new ApiException("Something went wrong!");
    }
};

export const decodeBase64 = (contents: string): string => {
    return Buffer.from(contents, "base64").toString("utf-8");
};

export const encodeBase64 = (contents: string): string => {
    return Buffer.from(contents, "utf-8").toString("base64");
};

export const validateBasicAuth = (event): Promise<LoginUserCommand> => {
    return new Promise<LoginUserCommand>((resolve, reject) => {
        const result = retrieveBasicAuth(event);
        if (result instanceof AuthException) {
            reject(result);
        } else {
            resolve(result);
        }
    });
};

const retrieveBasicAuth = (event): LoginUserCommand | AuthException => {
    const authHeader = event.headers["Authorization"];
    if (!authHeader) {
        return authError(Error("Invalid Authorization token - does not match 'Basic .*'"));
    }

    const match = authHeader.match(/^Basic (.*)$/);
    if (!match || match.length < 2) {
        return authError(Error("Invalid Authorization token - does not match 'Basic .*'"));
    }

    const auth = decodeBase64(match[1]).split(":");
    if (!auth || auth.length < 2) {
        return authError(Error("Invalid Authorization token"));
    }
    return {
        email: auth[0],
        password: auth[1]
    };
};

export type IGeneric<T> = {
    [index in string | number | any]: T;
};

export const validateAgainstConstraints = (values: IGeneric<string | number | any>, constraints: IGeneric<object>) => {
    setUpCustomValidators();
    return new Promise<void>((resolve, reject) => {
        const result = validate(values, constraints);
        validate(values, constraints); // HACK
        if (typeof result === "undefined") {
            console.info("Request validated");
            resolve();
        } else {
            console.error("Failed Request Validation >>", result);
            reject(Error("Invalid request fields"));
        }
    });
};

export const validateSupportedFileTypes = async (fileName: string): Promise<boolean> => {
    const getMime = require("name2mime");
    const mimeType = await getMime(fileName);
    return jimpSupportsMimeType(mimeType.type) || !!videoFormatToMimetype[fileName.split(".").pop()];
};

export const jimpSupportsMimeType = (mimeType: string): boolean => {
    const jimpSupportedMimeTypes: string[] = [Jimp.MIME_BMP, Jimp.MIME_X_MS_BMP, Jimp.MIME_GIF, Jimp.MIME_TIFF, Jimp.MIME_PNG, Jimp.MIME_JPEG];
    return jimpSupportedMimeTypes.includes(mimeType);
};
