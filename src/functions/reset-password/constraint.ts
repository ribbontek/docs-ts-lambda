export default {
    email: {
        presence: {
            allowEmpty: false
        },
        type: "string",
        email: true
    },
    password: {
        presence: {
            allowEmpty: false
        },
        type: "string",
        format: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\^$*.\[\]{}\(\)?\-\"!@#%&\/,><\':;|_~`])\S{8,99}$/
    },
    code: {
        presence: {
            allowEmpty: false
        },
        type: "string"
    },
} as const;
