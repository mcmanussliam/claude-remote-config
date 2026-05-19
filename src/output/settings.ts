export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

/** Deep-merges JSON fragments: arrays are deduped by value, objects are recursively merged, scalars are last-write-wins. */
export function mergeSettings(values: JsonValue[]): JsonValue {
  return values.reduce<JsonValue>((merged, value) => mergeJson(merged, value), {});
}

function mergeJson(left: JsonValue, right: JsonValue): JsonValue {
  if (Array.isArray(left) && Array.isArray(right)) {
    return [...new Set([...left, ...right].map((item) => JSON.stringify(item)))].map((item) => JSON.parse(item) as JsonValue);
  }

  if (isRecord(left) && isRecord(right)) {
    const output: Record<string, JsonValue> = { ...left };
    for (const [key, value] of Object.entries(right)) {
      output[key] = key in output ? mergeJson(output[key], value) : value;
    }
    return output;
  }

  return right;
}

function isRecord(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
