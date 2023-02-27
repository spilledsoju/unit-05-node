require("dotenv").config();
const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { expect } = require("chai");
const api = require("../index.js");
const dateNow = Date.now();
const jsonPath = path.join(__dirname, "..", process.env.BASE_JSON_PATH);
const defaultTodos = [
  {
    id: "01507581-9d12-a4c4-06bb-19d539a11189",
    name: "Learn to use Adobe Photoshop",
    completed: true,
  },
  {
    id: "19d539a11189-bb60-u663-8sd4-01507581",
    name: "Buy 2 Cartons of Milk",
    completed: true,
  },
  {
    id: "19d539a11189-4a60-3a4c-4434-01507581",
    name: "Learn to juggle",
    completed: false,
  },
  {
    id: "7895as2s4c-4a60-3a4c-7acc-895as1cc85",
    name: "Renew Passport",
    completed: false,
  },
];
const getTodos = async () => {
  return new Promise((resolve, reject) =>
    fs.readFile(jsonPath, { encoding: "utf-8" }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    })
  );
};
const saveTodos = async (todos) => {
  return await fs.writeFile(
    jsonPath,
    JSON.stringify(todos, null, 2) + "\n",
    (err) => {
      if (err) {
        console.error(err);
        return;
      }
    }
  );
};
const suiteSetup = () => {
  before(() => {
    defaultTodos.forEach((todo, i) => {
      const due = new Date(dateNow);

      due.setUTCDate(due.getUTCDate() + (i + 2 - defaultTodos.length) * 7);
      todo.due = due.toISOString();
      due.setUTCDate(due.getUTCDate() - 7);
      todo.created = due.toISOString();
    });

    return saveTodos(defaultTodos);
  });
};

describe("GET /todos", function () {
  suiteSetup();
  const path = "/todos";

  it("should be listening and respond with the content type set to application/json", async () => {
    await request(api)
      .get(path)
      .expect("Content-Type", /application\/json/)
      .expect(200);
  });

  it("should return array of all todos", async () => {
    await request(api)
      .get(path)
      .expect((res) => {
        const actual = [...new Set(res.body)];
        getTodos().then((expected) => {
          expect(actual).to.be.an("array");
          expect(actual).to.have.lengthOf(expected.length);
        });
      });
  });

  it("should return empty array if there are no todos", async () => {
    await saveTodos([]).then(async (value) => {
      await request(api)
        .get(path)
        .expect((res) => {
          const now = new Date();
          const actual = [...new Set(res.body)];

          expect(actual).to.be.an("array");
          expect(actual).to.have.lengthOf(0);
        });
    });
  });
});

describe("GET /todos/:id", function () {
  suiteSetup();
  const path = "/todos";

  it("should successfully return task with id '19d539a11189-bb60-u663-8sd4-01507581' and return status 200 (OK)", async () => {
    await request(api)
      .get(path + "/19d539a11189-bb60-u663-8sd4-01507581")
      .send()
      .expect(200);
  });

  it("should return 404 (Not Found) when invalid id is sent to complete", async () => {
    await request(api)
      .get(path + "/0xxx1235")
      .send()
      .expect(404);
  });
});

describe("GET /todos/overdue", function () {
  suiteSetup();
  const path = "/todos/overdue";

  it("should be listening and respond with the content type set to application/json", async () => {
    await request(api)
      .get(path)
      .expect("Content-Type", /application\/json/)
      .expect(200);
  });

  it("should return array of overdue todos", async () => {
    await request(api)
      .get(path)
      .expect((res) => {
        const now = new Date();
        const actual = [...new Set(res.body)];
        getTodos().then((expected) => {
          expected.filter(
            (todo) => new Date(todo.due) < now && todo.completed === false
          );

          expect(actual).to.be.an("array");
          expect(actual).to.have.lengthOf(expected.length);
          actual.forEach(function (overdue, index) {
            expect(new Date(overdue.due)).to.be.lessThan(now);
            expect(overdue.completed).to.be.false;
          });
        });
      });
  });

  it("should return empty array if there are no overdue todos", async () => {
    await saveTodos([]).then(async (value) => {
      await request(api)
        .get(path)
        .expect((res) => {
          const now = new Date();
          const actual = [...new Set(res.body)];

          expect(actual).to.be.an("array");
          expect(actual).to.have.lengthOf(0);
        });
    });
  });
});

describe("GET /todos/completed", function () {
  suiteSetup();
  const path = "/todos/completed";

  it("should be listening and respond with the content type set to application/json", async () => {
    await request(api)
      .get(path)
      .expect("Content-Type", /application\/json/)
      .expect(200);
  });

  it("should return array of completed todos", async () => {
    await request(api)
      .get(path)
      .expect((res) => {
        const actual = [...new Set(res.body)];
        const expected = getTodos().then((expected) => {
          expected.filter((todo) => todo.completed === true);

          expect(actual).to.be.an("array");
          expect(actual).to.have.lengthOf(expected.length);
          actual.forEach(function (todo) {
            expect(todo.completed).to.be.true;
          });
        });
      });
  });

  it("should return empty array if there are no completed todos", async () => {
    await saveTodos([]).then(async (value) => {
      await request(api)
        .get(path)
        .expect((res) => {
          const now = new Date();
          const actual = [...new Set(res.body)];

          expect(actual).to.be.an("array");
          expect(actual).to.have.lengthOf(0);
        });
    });
  });
});

describe("POST /todos", function () {
  suiteSetup();
  const path = "/todos";

  it("should return status 201 (Created)", async () => {
    await request(api)
      .post(path)
      .send({
        name: "Turn on central heating",
        due: new Date("30 December 2021 14:48").toISOString(),
      })
      .expect(201);
  });

  it("should contain newly created todo: 'Turn on central heating'", async () => {
    await request(api)
      .get(path)
      .expect((res) => {
        const todos = [...new Set(res.body)].filter((todo) => {
          return todo.name === "Turn on central heating";
        });

        expect(
          todos,
          `${
            todos.length == 0 ? "No" : "Multiple"
          } todos with name 'Turn on central heating'. Expected exactly one`
        ).to.have.lengthOf(1);
        expect(todos[0], "Missing property 'created'").to.have.property(
          "created"
        );
        expect(todos[0], "Missing property 'completed'").to.have.property(
          "completed"
        );
      });
  });

  it("should return status 400 (Bad Request) when invalid todo is sent", async () => {
    await request(api)
      .post(path)
      .send({ jibberish: "Should not work" })
      .expect(400);
  });
});

describe("PATCH /todos:id", function () {
  suiteSetup();
  const path = "/todos";

  it("should update/patch and return status 200 (OK)", async () => {
    await request(api)
      .patch(path + "/19d539a11189-bb60-u663-8sd4-01507581")
      .send({ name: "Buy 6 Cartons of Milk" })
      .expect(200);
  });

  it("should contain the patched todo: 'Buy 6 Cartons of Milk'", async () => {
    await request(api)
      .get(path)
      .expect((res) => {
        const todos = [...new Set(res.body)].filter((todo) => {
          return todo.name === "Buy 6 Cartons of Milk";
        });
        expect(
          todos,
          `${
            todos.length == 0 ? "No" : "Multiple"
          } todos with name 'Buy 6 Cartons of Milk'. Expected exactly one`
        ).to.have.lengthOf(1);
      });
  });
});

describe("POST /todos/:id/complete", function () {
  suiteSetup();
  const path = "/todos";

  it("should successfully COMPLETE  task with id '19d539a11189-bb60-u663-8sd4-01507581' and return status 200 (OK)", async () => {
    await request(api)
      .post(path + "/19d539a11189-bb60-u663-8sd4-01507581/complete")
      .send()
      .expect(200);
  });

  it("should return 404 (Not Found) when invalid id is sent to complete", async () => {
    await request(api)
      .post(path + "/0xxx1235/complete")
      .send()
      .expect(404);
  });

  it("should contain COMPLETED todo with id '19d539a11189-bb60-u663-8sd4-01507581'", async () => {
    await request(api)
      .get(path + "/completed")
      .expect((res) => {
        const todos = [...new Set(res.body)].filter((todo) => {
          return (
            todo.id === "19d539a11189-bb60-u663-8sd4-01507581" && todo.completed
          );
        });
        expect(
          todos,
          `${
            todos.length == 0 ? "No" : "Multiple"
          }  with id '19d539a11189-bb60-u663-8sd4-01507581'. Expected exactly one`
        ).to.have.lengthOf(1);
      });
  });
});

describe("POST /todos/:id/undo", function () {
  suiteSetup();
  const path = "/todos";

  it("should successfully UNDO task with id '01507581-9d12-a4c4-06bb-19d539a11189' and return status 200 (OK)", async () => {
    await request(api)
      .post(path + "/01507581-9d12-a4c4-06bb-19d539a11189/undo")
      .send()
      .expect(200);
  });

  it("should return 404 (Not Found) when invalid id is sent to undo", async () => {
    await request(api)
      .post(path + "/0xxx1235/undo")
      .send()
      .expect(404);
  });

  it("should contain INCOMPLETE todo with id '01507581-9d12-a4c4-06bb-19d539a11189'", async () => {
    await request(api)
      .get(path)
      .expect((res) => {
        const todos = [...new Set(res.body)].filter((todo) => {
          return (
            todo.id === "01507581-9d12-a4c4-06bb-19d539a11189" &&
            todo.completed == false
          );
        });
        expect(
          todos,
          `${
            todos.length == 0 ? "No" : "Multiple"
          } todos with id '01507581-9d12-a4c4-06bb-19d539a11189'. Expected exactly one`
        ).to.have.lengthOf(1);
      });
  });
});

describe("DELETE /todos/:id", function () {
  suiteSetup();
  const path = "/todos";

  it("should successfully DELETE task 'Learn to juggle' by id and return status 200 (OK)", async () => {
    await request(api)
      .delete(path + "/19d539a11189-4a60-3a4c-4434-01507581")
      .expect(200);
  });

  it("should NOT CONTAIN any todo with name 'Learn to juggle', id '19d539a11189-4a60-3a4c-4434-01507581'", async () => {
    await request(api)
      .get(path)
      .expect((res) => {
        const todos = [...new Set(res.body)].filter((todo) => {
          todo.id === "19d539a11189-4a60-3a4c-4434-01507581";
        });
        expect(
          todos,
          `${
            todos.length == 0 ? "No" : "Multiple"
          } todos with name 'Learn to juggle', id '19d539a11189-4a60-3a4c-4434-01507581'. Expected exactly one`
        ).to.have.lengthOf(0);
      });
  });

  it("should return 404 (Not Found) when invalid id is sent to DELETE", async () => {
    await request(api)
      .delete(path + "/xxx123")
      .expect(404);
  });
});
