export const isProd = () => process.env.NODE_ENV === "production";
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
