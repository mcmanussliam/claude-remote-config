import { z } from 'zod';
const RequiresSchema = z
    .object({
    filesAny: z.array(z.string()).optional(),
    filesAll: z.array(z.string()).optional(),
})
    .strict()
    .optional();
export function parseRequires(value) {
    const parsed = RequiresSchema.safeParse(value);
    if (!parsed.success) {
        throw new Error(`Invalid requires: ${parsed.error.message}`);
    }
    return parsed.data;
}
export function evaluateRequires(requires, project) {
    if (!requires) {
        return { pass: true };
    }
    if (requires.filesAll?.length) {
        const missing = requires.filesAll.filter((file) => !project.files.has(file));
        if (missing.length) {
            return { pass: false, reason: `missing required file: ${missing[0]}` };
        }
    }
    if (requires.filesAny?.length && !requires.filesAny.some((file) => project.files.has(file))) {
        return { pass: false, reason: `none of required files exist: ${requires.filesAny.join(', ')}` };
    }
    return { pass: true };
}
