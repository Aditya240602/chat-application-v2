import http from "k6/http";
import { check } from "k6";
import { BASE_URL, login } from "./common.js";

export const options = {
    vus: 5,
    duration: "30s",
};

export function setup() {
    return {
        token: login(),
    };
}

export default function (data) {

    const params = {
        headers: {
            Authorization: `Bearer ${data.token}`,
            "Content-Type": "application/json",
        },
    };

    const body = JSON.stringify({
        receiver: 2,
        content: `Stress ${Date.now()}`
    });

    const res = http.post(
        `${BASE_URL}/api/chat/messages/`,
        body,
        params
    );

    check(res, {
        "Message accepted or throttled": (r) =>
            r.status === 201 || r.status === 429,
    });
}