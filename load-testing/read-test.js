import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, login } from "./common.js";

export const options = {
    vus: 10,
    duration: "1m",
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
        },
    };

    // Fetch conversation list
    const usersRes = http.get(`${BASE_URL}/api/users/`, params);

    check(usersRes, {
        "Users fetched": (r) => r.status === 200,
    });

    // Fetch conversation
    const msgRes = http.get(
        `${BASE_URL}/api/chat/messages/?user_id=2`,
        params
    );

    check(msgRes, {
        "Messages fetched": (r) => r.status === 200,
    });

    // Check unread count
    const unreadRes = http.get(
        `${BASE_URL}/api/chat/unread_counts/`,
        params
    );

    check(unreadRes, {
        "Unread fetched": (r) => r.status === 200,
    });

    sleep(2);
}