import { TextractClient } from "@aws-sdk/client-textract";

export const textractClient = (): TextractClient => {
    return new TextractClient(
        {
            region: process.env.AWS_REGION,

        }
    );
};
