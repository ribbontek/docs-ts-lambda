export default {
    message: {
        presence: {
            allowEmpty: false
        },
        length: {
            minimum: 1,
            maximum: 1000
        },
        type: "string"
    },
    privacy: {
        presence: {
            allowEmpty: false,
        },
        type: "string",
        inclusion: ["me", "everyone"]
    },
    fileIds: {
        customArray: {
            type: "string",
            format: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi
        },
        presence: true,
        length: {
            maximum: 100
        },
        type: "array"
    },
    userId: {
        presence: {
            allowEmpty: false
        },
        type: "string",
        format: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi
    }
} as const;
