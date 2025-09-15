import createClient, { Middleware } from "openapi-fetch"

import { paths } from "./schema"

const middleware: Middleware = {
  async onRequest({ request }) {
    const accessToken = localStorage.getItem("accessToken")
    if (accessToken) {
      request.headers.set("Authorization", `Bearer ${accessToken}`)
    }
    return request
  },
  async onResponse({ response }) {
    // if (response.status === 401) {
    // }

    return response
  },
}

const client = createClient<paths>({
  baseUrl: process.env.BACKEND_URL || "http://localhost:3001",
  fetch: (url, init = {}) => {
    return fetch(url, {
      ...init,
      cache: "no-store",
    })
  },
})

client.use(middleware)

export { client }
