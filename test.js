const request = require("supertest");
const app = require("./app");

describe("GET /departments", () => {
  test("it should respond with 200 success", async () => {
    const response = await request(app).get("/departments");

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();
  });
});
