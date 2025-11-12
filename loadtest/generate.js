import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  stages: [
    { duration: "1m", target: 10 }, // ramp up to 10 users over 1 minute
    { duration: "8m", target: 10 }, // hold steady for 8 minutes
    { duration: "1m", target: 0 }, // ramp down to 0 users
  ],
};

// const BASE_URL = "https://openexam-api.bookpanda.dev/api/cheatsheet/generate";
const BASE_URL = "http://host.docker.internal:3001/api/cheatsheet/generate";
const TOKEN = "YOUR_JWT_TOKEN_HERE"; // same JWT from Google login

export default function () {
  const payload = JSON.stringify({
    file_ids: ["586027e5-e866-4d77-a77d-bd23dbe6269e"],
  });
  //   const payload = JSON.stringify({
  //     file_ids: ["real id here"],
  //   });
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
  sleep(30);
}
