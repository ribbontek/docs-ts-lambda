import { isArray, isEmpty, single, validate, validators } from "validate.js";

/**
 * Sets up custom validators
 */
export const setUpCustomValidators = () => {
    validators.customArray = (arrayItems, constraints) => {
        if (isArray(arrayItems)) {
            const arrayItemErrors = arrayItems.reduce((errors, item, index) => {
                console.info(`Checking ${item} for index ${index} for constraints ${JSON.stringify(constraints)} using ${typeof item === "object" ? "validate" : "single"}`);
                const error = typeof item === "object" ? validate(item, constraints) : single(item, constraints);
                typeof item === "object" ? validate(item, constraints) : single(item, constraints); // HACK - calling twice as every second call seems to have an illegitimate issue & I have no idea why (buggy lib code???)
                console.info(`error ${error}`);
                if (!!error) {
                    errors[index] = {error: `${item} ${error}`};
                }
                return errors;
            }, []);

            return isEmpty(arrayItemErrors) ? null : {errors: JSON.stringify(arrayItemErrors.filter(error => error != null))};
        }
        return {errors: ["Not an array"]};
    };
};
