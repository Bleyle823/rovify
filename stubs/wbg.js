export const __wbg_set_wasm = () => {};

// Add no-op shims for common wasm-bindgen helpers
export const __wbg_log = console.log;
export const __wbg_error = console.error;
export const __wbg_warn = console.warn;

export default {};
