import http from "k6/http";
import { sleep, check } from "k6";

export let options = {
  stages: [
    { duration: "10s", target: 10 }, // ramp-up to 10 users
    { duration: "30s", target: 10 }, // hold for 30 seconds
    { duration: "10s", target: 0 }, // ramp-down
  ],
};

const BASE_URL = "https://openexam-api.bookpanda.dev/api/cheatsheet/files";
const TOKEN = "YOUR_JWT_TOKEN_HERE"; // same one from /google/callback

export default function () {
  const res = http.get(BASE_URL, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  sleep(1);
}
