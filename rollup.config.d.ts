declare var _default: ({
    input: string;
    output: {
        compact: boolean;
        sourcemap: boolean;
        name: string;
        file: string;
        format: string;
        globals: {
            'lodash.isdate': string;
            debug: string;
        };
    };
    plugins: import("rollup").Plugin[];
} | {
    input: string;
    output: {
        compact: boolean;
        sourcemap: boolean;
        name: string;
        file: string;
        format: string;
        globals: {};
    };
    plugins: import("rollup").Plugin[];
})[];
export default _default;
