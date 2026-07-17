import http from "k6/http";
import { check } from "k6";

const BASE_URL = "https://pulse-backend-pjw9.onrender.com";

export const options = {
  vus: 5,
  iterations: 5,
};

export function setup() {
  console.log("Logging in...");

  const payload = JSON.stringify({
    username: "aditya",
    password: "pinku",
  });

  const res = http.post(
    `${BASE_URL}/api/login/`,
    payload,
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

  return {
    token: res.json("access"),
  };
}

export default function (data) {
  console.log("Authenticated request");

  const params = {
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  };

  const res = http.get(
    `${BASE_URL}/api/users/`,
    params
  );

  check(res, {
    "Users fetched": (r) => r.status === 200,
  });
}