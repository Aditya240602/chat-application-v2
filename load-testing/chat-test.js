import http from "k6/http";
import { check, sleep } from "k6";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";
import { BASE_URL, login } from "./common.js";

export const options = {
    stages: [
        { duration: "1m", target: 50 },
        { duration: "1m", target: 75 },
        { duration: "1m", target: 100 },
        { duration: "1m", target: 150 },
        { duration: "1m", target: 200 },
        { duration: "1m", target: 0 },
    ],
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

    // Open conversations
    const users = http.get(`${BASE_URL}/api/users/`, params);

    check(users, {
        "Users fetched": (r) => r.status === 200,
    });

    // Open one conversation
    const messages = http.get(
        `${BASE_URL}/api/chat/messages/?user_id=2`,
        params
    );

    check(messages, {
        "Messages fetched": (r) => r.status === 200,
    });

    // Send message only 30% of the time
    if (Math.random() < 0.3) {

        const body = JSON.stringify({
            receiver: 2,
            content: `Hello from k6 ${Date.now()}`
        });

        const send = http.post(
            `${BASE_URL}/api/chat/messages/`,
            body,
            params
        );

        check(send, {
            "Message sent": (r) =>
                r.status === 201 || r.status === 429,
        });
    }

    const unread = http.get(
        `${BASE_URL}/api/chat/unread_counts/`,
        params
    );

    check(unread, {
        "Unread fetched": (r) => r.status === 200,
    });

    sleep(randomIntBetween(2, 5));
}