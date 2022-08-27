import { handlerPath } from "@libs/handler-resolver";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            http: {
                method: "post",
                path: "/v1/post/_create",
                authorizer: {
                    name: "verify-token"
                }
            },
        },
    ]
};

