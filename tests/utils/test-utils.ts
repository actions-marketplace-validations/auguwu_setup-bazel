// See: https://github.com/actions/toolkit/blob/a1b068ec31a042ff1e10a522d8fdf0b8869d53ca/packages/core/src/core.ts#L89
export function getInputName(name: string) {
    return `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
}

export function setInput(name: string, value: string) {
    process.env[getInputName(name)] = value;
}

export function resetProcessEnv(): NodeJS.ProcessEnv {
    return Object.keys(process.env).reduce((acc, curr) => {
        if (!curr.startsWith('INPUT_')) {
            acc[curr] = process.env[curr];
        }

        return acc;
    }, {} as NodeJS.ProcessEnv);
}
