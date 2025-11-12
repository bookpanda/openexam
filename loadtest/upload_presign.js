import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  vus: 3, // 3 virtual users
  duration: "30s", // total test time
};

const API_URL = "http://host.docker.internal:3001";
// const API_URL = "https://openexam-api.bookpanda.dev";
const TOKEN = "PASTE_YOUR_JWT_TOKEN_HERE"; // get one from real login

const HEADERS = { Authorization: `Bearer ${TOKEN}` };

export default function () {
  // 1️⃣ Get presigned URL
  const presignRes = http.get(
    `${API_URL}/api/cheatsheet/presigned/upload?filename=test.pdf`,
    { headers: HEADERS }
  );

  check(presignRes, { "got presigned URL": (r) => r.status === 200 });

  const presignUrl = presignRes.json("url");
  if (!presignUrl) {
    console.error("No presigned URL returned!");
    return;
  }

  // 2️⃣ Upload PDF file to S3 via presigned URL
  const pdf = new ArrayBuffer(1024 * 100); // 100 KB fake PDF
  const uploadRes = http.put(presignUrl, pdf, {
    headers: { "Content-Type": "application/pdf" },
  });

  check(uploadRes, { "upload success": (r) => r.status === 200 });

  sleep(1);
}
