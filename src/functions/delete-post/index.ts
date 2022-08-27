import { handlerPath } from "@libs/handler-resolver";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            http: {
                method: "delete",
                path: "/v1/post/{postId}",
                authorizer: {
                    name: "verify-token"
                }
            },
        },
    ]
};

