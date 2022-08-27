export default {
    limit: {
        presence: false,
        type: "number"
    },
    lastEvaluatedKey: {
        presence: false
    },
    message: {
        presence: false,
        type: "string",
    },
    userId: {
        presence: false,
        type: "string",
        format: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi
    }
} as const;
