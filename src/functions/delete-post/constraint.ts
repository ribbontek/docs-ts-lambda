export default {
    postId: {
        presence: {
            allowEmpty: false
        },
        type: "string",
        format: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi
    },
    userId: {
        presence: {
            allowEmpty: false
        },
        type: "string",
        format: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi
    }
} as const;
