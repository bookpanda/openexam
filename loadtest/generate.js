import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  stages: [
    { duration: "20s", target: 3 }, // ramp up to 3 users over 20 seconds
    { duration: "20s", target: 3 }, // hold steady for 20 seconds
    { duration: "20s", target: 0 }, // ramp down to 0 users
  ],
};

// const BASE_URL = "http://host.docker.internal:3001/api/cheatsheet/generate";
const BASE_URL = "https://openexam-api.bookpanda.dev/api/cheatsheet/generate";
const TOKEN = "YOUR_JWT_TOKEN_HERE"; // same JWT from Google login

export default function () {
  const payload = JSON.stringify({
    file_ids: ["e9fca726-e03b-4e12-b39b-06323ba72b97"],
  });
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };
  // Allow up to 120 seconds per request, normally it take around 30s if server has no workload
  const res = http.post(BASE_URL, payload, { headers, timeout: "120s" });

  check(res, {
    "status 200": (r) => r.status === 200,
  });

  // simulate user waiting between generations (~30 seconds)
  sleep(5);
}
