import { login } from "./common.js";

export const options = {
    vus: 1,
    iterations: 1,
};

export default function () {
    login();
}