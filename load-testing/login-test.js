import http from "k6/http";
import { check } from "k6";

export const options = {
    vus: 10,
    duration: "30s",
};

const BASE_URL = "https://pulse-backend-pjw9.onrender.com";

export default function () {

    const payload = JSON.stringify({
        username: "YOUR_USERNAME",
        password: "YOUR_PASSWORD"
    });

    const params = {
        headers: {
            "Content-Type": "application/json",
        },
    };

    const res = http.post(
        `${BASE_URL}/api/login/`,
        payload,
        params
    );

    check(res, {
        "login successful": (r) => r.status === 200,
    });
}