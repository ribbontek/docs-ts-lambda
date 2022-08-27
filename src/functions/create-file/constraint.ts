export default {
    name: {
        presence: {
            allowEmpty: false
        },
        length: {
            minimum: 1,
            maximum: 1000
        },
        type: "string",
        format: /\w+(\.)\w+/g
        // expects "filename.extension" / "filename_asdf.extension" format
    },
    userId: {
        presence: {
            allowEmpty: false
        },
        type: "string",
        format: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi
        // expects UUID format
    }
} as const;
