import http from "k6/http";
import { check } from "k6";

export const BASE_URL = "https://pulse-backend-pjw9.onrender.com";

const USERNAME = "aditya";
const PASSWORD = "pinku";

export function login() {
    const res = http.post(
        `${BASE_URL}/api/login/`,
        JSON.stringify({
            username: USERNAME,
            password: PASSWORD,
        }),
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    check(res, {
        "Login successful": (r) => r.status === 200,
    });

    if (res.status !== 200) {
        throw new Error(`Login failed: ${res.status}`);
    }

    return res.json("access");
}