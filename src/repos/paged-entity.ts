import { NativeAttributeValue } from "@aws-sdk/util-dynamodb";

export interface PagedEntity<T> {
    data: T[];
    size: number;
    total: number;
    lastEvaluatedKey: Record<string, NativeAttributeValue>;
}
