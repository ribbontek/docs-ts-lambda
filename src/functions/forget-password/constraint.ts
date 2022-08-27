export default {
    email: {
        presence: {
            allowEmpty: false
        },
        type: "string",
        email: true
    }
} as const;
