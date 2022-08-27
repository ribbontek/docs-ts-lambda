export const formatJSONResponse = (statusCode: number, response: Record<any, unknown> | null) => {
    return {
        statusCode,
        headers: {contentType: "application/json"},
        body: !!response ? JSON.stringify(response) : JSON.stringify({})
    };
};
