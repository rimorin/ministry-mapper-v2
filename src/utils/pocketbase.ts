import PocketBase from "pocketbase";

const { VITE_POCKETBASE_URL } = import.meta.env;

const pb = new PocketBase(VITE_POCKETBASE_URL);

export { pb };
