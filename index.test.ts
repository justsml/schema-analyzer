import {
  schemaAnalyzer,
  _getNumberRangeStats,
  _condenseFieldData,
  _pivotFieldDataByType,
  parseDate,
} from "./index";
import path from "path";
import fs from "fs";
import csvParse from "csv-parse";
import UserNotes from "./__tests__/user-notes.json";

const productCsv: Promise<any[]> = parseCsv(
  fs.readFileSync(
    path.resolve(__dirname, "./__tests__/products-3000.csv"),
    "utf8"
  )
);

function parseCsv(content): Promise<any[]> {
  return new Promise((resolve, reject) => {
    csvParse(
      content,
      {
        columns: true,
        trim: true,
        skip_empty_lines: true,
      },
      (err, results, info) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}

const isCI = process.env.CI;

/** example structured data */
const getUsers = () => UserNotes;

describe("handles invalid usage", () => {
  it("handles missing arguments", () => {
    expect(() => schemaAnalyzer("test", [{}, {}], {})).toThrowError(
      /requires at least 5/
    );
    expect(() => schemaAnalyzer("test", ["test"])).toThrowError(
      /must be an Array of Objects/
    );
    // @ts-ignore
    expect(() => schemaAnalyzer("test", "test")).toThrowError(
      /must be an Array/
    );
    // @ts-ignore
    expect(() => schemaAnalyzer("test", null)).toThrowError(/must be an Array/);
  });
});

describe("primary use-cases", () => {
  it("analyze users.json", () => {
    const users = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "./__tests__/users.example.json"),
        "utf8"
      )
    );
    return schemaAnalyzer("users", users).then((result) =>
      expect(result).toMatchSnapshot("usersResult")
    );
  });

  it("analyze properties.json", () => {
    const properties = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "./__tests__/real-estate.example.json"),
        "utf8"
      )
    );
    return schemaAnalyzer("properties", properties, {
      disableNestedTypes: true,
    }).then((result) => expect(result).toMatchSnapshot("propertiesResult"));
  });

  it("analyze all 3K+ rows in products.csv", async () => {
    const result = await schemaAnalyzer("products", await productCsv);
    expect(result).toMatchSnapshot("productsResult");
  });

  it("analyze top 1250 rows in products.csv", async () => {
    const result = await schemaAnalyzer(
      "products",
      (await productCsv).slice(0, 1250)
    );
    expect(result).toMatchSnapshot("productsResult_1250");
  });

  it("analyze top 250 rows in products.csv", async () => {
    const result = await schemaAnalyzer(
      "products",
      (await productCsv).slice(0, 250)
    );
    expect(result).toMatchSnapshot("productsResult_250");
  });

  it("analyze inline csv", async () => {
    const sampleCsv = await parseCsv(`id,name,role,email,createdAt,accountConfirmed
  1,Eve,poweruser,eve@example.com,2020-01-20,undefined
  2,Alice,user,ali@example.com,2020-02-02,true
  3,Bob,user,robert@example.com,2019-12-31,true
  4,Elliot Alderson,admin,falkensmaze@protonmail.com,2001-01-01,false
  5,Sam Sepiol,admin,falkensmaze@hotmail.com,9/9/99,true`);

    return schemaAnalyzer("sampleCsv", sampleCsv as any[]).then((result) => {
      // if (!isCI) console.log(JSON.stringify(result, null, 2))
      expect(result).toMatchSnapshot("accountsCsvResult");
    });
  });

  it("analyze people.json", () => {
    const people = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "./__tests__/swapi-people.json"),
        "utf8"
      )
    );
    people[0].created = new Date(people[0].created);
    people[1].created = new Date("0000-01-01");
    people[2].created = new Date("x");
    return schemaAnalyzer("people", people).then((result) => {
      // if (!isCI) console.log('people', JSON.stringify(result, null, 2))
      expect(result).toMatchSnapshot("peopleResult");
    });
  });

  it("can handle nested types", () => {
    const users = getUsers();
    return schemaAnalyzer("users", users).then((result) => {
      expect(result.fields.name).toBeDefined();
      // if (!isCI) console.log('result.fields.id', result.fields.id)
      // if (!isCI) console.log('result.fields.name', result.fields.name)
      // if (!isCI) console.log('result.fields.notes', result.fields.notes)
      // if (!isCI) console.log('result.fields.notes.$ref', result.fields.notes.$ref)
      // if (!isCI) console.log('result.nestedTypes', result.nestedTypes)

      expect(result.fields.name?.nullable).toBeFalsy();
      expect(result.fields.notes).toBeDefined();
      // @ts-ignore
      expect(result.fields?.notes?.types.$ref).toBeDefined();
      // @ts-ignore
      expect(result.fields?.notes?.types.$ref.typeAlias).toBe("users.notes");
      expect(result.nestedTypes).toBeDefined();
      // @ts-ignore
      expect(result.nestedTypes["users.notes"]).toBeDefined();
      // @ts-ignore
      expect(result.nestedTypes["users.notes"].fields.id.nullable).toBeFalsy();
      expect(result).toMatchSnapshot("nestedData");
    });
  });

  it("can analyze schema w/ enum options", () => {
    const properties = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "./__tests__/real-estate.example.json"),
        "utf8"
      )
    );
    const lowEnumLimitLoosePct = schemaAnalyzer("properties", properties, {
      enumMinimumRowCount: 10,
      enumAbsoluteLimit: 30,
      enumPercentThreshold: 0.2,
    }).then((result) =>
      expect(result).toMatchSnapshot("propertiesResult_lowEnumLimitLoosePct")
    );
    const lowEnumLimitLoose = schemaAnalyzer("properties", properties, {
      enumMinimumRowCount: 10,
      enumAbsoluteLimit: 30,
    }).then((result) =>
      expect(result).toMatchSnapshot("propertiesResult_lowEnumLimitLoose")
    );
    const lowEnumLimit = schemaAnalyzer("properties", properties, {
      enumMinimumRowCount: 10,
    }).then((result) =>
      expect(result).toMatchSnapshot("propertiesResult_lowEnumLimit")
    );
    const highEnumLimit = schemaAnalyzer("properties", properties, {
      enumMinimumRowCount: 1000,
    }).then((result) =>
      expect(result).toMatchSnapshot("propertiesResult_highEnumLimit")
    );
    const highNullableLimit = schemaAnalyzer("properties", properties, {
      nullableRowsThreshold: 0.25,
    }).then((result) =>
      expect(result).toMatchSnapshot("propertiesResult_highNullableLimit")
    );
    const lowNullableLimit = schemaAnalyzer("properties", properties, {
      nullableRowsThreshold: 0,
    }).then((result) =>
      expect(result).toMatchSnapshot("propertiesResult_lowNullableLimit")
    );
    const notStrict = schemaAnalyzer("properties", properties, {
      strictMatching: false,
    }).then((result) =>
      expect(result).toMatchSnapshot("propertiesResult_notStrict")
    );
    return Promise.all([
      lowEnumLimitLoosePct,
      lowEnumLimitLoose,
      lowEnumLimit,
      highEnumLimit,
      highNullableLimit,
      lowNullableLimit,
      notStrict,
    ]);
  });
});

describe("behavior verification", () => {
  it("can run onProgress callback, until done", () => {
    const onProgress = jest.fn();
    const users = getUsers();
    return schemaAnalyzer("users", users, { onProgress }).then((result) => {
      // const progMock = onProgress.mock.calls
      const mockRunCount = onProgress.mock.instances.length;
      // const lastCall = progMock[progMock.length - 1]
      expect(result.fields.name).toBeDefined();
      expect(mockRunCount).toBeGreaterThan(1);
    });
  });
});

describe("utility & helper methods", () => {
  it("number range analysis handles invalid data", () => {
    // @ts-ignore
    expect(_getNumberRangeStats(null)).toBeUndefined();
  });

  it("parseDate handles invalid input", () => {
    // @ts-ignore
    expect(parseDate("Heyo")).toBeNull();
  });
});
