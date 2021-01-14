import { schemaBuilder, getNumberRangeStats } from './index.js'
import path from 'path'
import fs from 'fs'
import csvParse from 'csv-parse'

const isCI = process.env.CI

/** example structured data */
const getUsers = () => [
  {
    id: 1,
    name: 'Dan', 
    notes: [{id: 997, text: 'hello'}, {id: 998, text: 'hello'}, {id: 999, text: 'hello'}]
  },
  {
    id: 2,
    name: 'Dan1', 
    notes: [{id: 1997, text: 'hello'}, {id: 1998, text: 'hello'}, {id: 1999, text: 'hello'}]
  },
  {
    id: 3,
    name: 'Dan2',
    notes: [{id: 2997, text: 'hello'}, {id: 2998, text: 'hello'}, {id: 2999, text: 'hello'}]
  },
  {
    id: 4,
    name: 'Dan3', 
    notes: [{id: 3997, text: 'hello'}, {id: 3998, text: 'hello'}, {id: 3999, text: 'hello'}]
  },
  {
    id: 5,
    name: 'Dan4', 
    notes: [{id: 4997, text: 'hello'}, {id: 4998, text: 'hello'}, {id: 4999, text: 'hello'}]
  },
];

it('handles missing arguments', () => {
  expect(() => schemaBuilder('test', [{}, {}])).toThrowError(/requires at least 5/)
  expect(() => schemaBuilder('test', ['test'])).toThrowError(/must be an Array of Objects/)
  // @ts-ignore
  expect(() => schemaBuilder('test', 'test')).toThrowError(/must be an Array/)
  expect(() => schemaBuilder('test', null)).toThrowError(/must be an Array/)
})

it('can analyze schema for ./users.json', () => {
  const users = JSON.parse(fs.readFileSync(path.resolve(__dirname, './__tests__/users.example.json'), 'utf8'))
  return schemaBuilder('users', users)
    .then((result) => expect(result).toMatchSnapshot('usersResult'))
})

it('can analyze schema for ./properties.json', () => {
  const properties = JSON.parse(fs.readFileSync(path.resolve(__dirname, './__tests__/real-estate.example.json'), 'utf8'))
  return schemaBuilder('properties', properties)
    .then((result) => expect(result).toMatchSnapshot('propertiesResult'))
})

it('can handle nested types', () => {
  const users = getUsers();
  return schemaBuilder('users', users)
    .then((result) => {
      expect(result.fields.name).toBeDefined();
      if (!isCI) console.log(`result.fields.id`, result.fields.id)
      if (!isCI) console.log(`result.fields.name`, result.fields.name)
      if (!isCI) console.log(`result.fields.notes`, result.fields.notes)
      if (!isCI) console.log(`result.fields.notes.$ref`, result.fields.notes.$ref)
      if (!isCI) console.log(`result.nestedTypes`, result.nestedTypes)
      
      expect(result.fields.name.nullable).toBeFalsy();
      expect(result.fields.notes).toBeDefined();
      expect(result.fields.notes.$ref).toBeDefined();
      expect(result.fields.notes.$ref.typeAlias).toBe('users.notes');
      expect(result.nestedTypes).toBeDefined();
      expect(result.nestedTypes['users.notes']).toBeDefined();
      expect(result.nestedTypes['users.notes'].fields.id.nullable).toBeFalsy();
    })
})

it('can analyze schema w/ enum options', () => {
  const properties = JSON.parse(fs.readFileSync(path.resolve(__dirname, './__tests__/real-estate.example.json'), 'utf8'))
  const lowEnumLimitLoosePct = schemaBuilder('properties', properties, { enumMinimumRowCount: 10, enumAbsoluteLimit: 30, enumPercentThreshold: 0.2 })
    .then((result) => expect(result).toMatchSnapshot('propertiesResult_lowEnumLimitLoosePct'))
  const lowEnumLimitLoose = schemaBuilder('properties', properties, { enumMinimumRowCount: 10, enumAbsoluteLimit: 30 })
    .then((result) => expect(result).toMatchSnapshot('propertiesResult_lowEnumLimitLoose'))
  const lowEnumLimit = schemaBuilder('properties', properties, { enumMinimumRowCount: 10 })
    .then((result) => expect(result).toMatchSnapshot('propertiesResult_lowEnumLimit'))
  const highEnumLimit = schemaBuilder('properties', properties, { enumMinimumRowCount: 1000 })
    .then((result) => expect(result).toMatchSnapshot('propertiesResult_highEnumLimit'))
  const highNullableLimit = schemaBuilder('properties', properties, { nullableRowsThreshold: 0.25 })
    .then((result) => expect(result).toMatchSnapshot('propertiesResult_highNullableLimit'))
  const lowNullableLimit = schemaBuilder('properties', properties, { nullableRowsThreshold: 0 })
    .then((result) => expect(result).toMatchSnapshot('propertiesResult_lowNullableLimit'))
  const notStrict = schemaBuilder('properties', properties, { strictMatching: false })
    .then((result) => expect(result).toMatchSnapshot('propertiesResult_notStrict'))
  return Promise.all([
    lowEnumLimitLoosePct,
    lowEnumLimitLoose,
    lowEnumLimit,
    highEnumLimit,
    highNullableLimit,
    lowNullableLimit,
    notStrict
  ])
})

it('can analyze schema for ./products.csv', () => {
  const productCsv = parseCsv(fs.readFileSync(path.resolve(__dirname, './__tests__/products-3000.csv'), 'utf8'))
  return productCsv.then((products) => {
    return schemaBuilder('products', products)
      .then((result) => {
        // if (!isCI) console.log('products', JSON.stringify(result, null, 2))
        expect(result).toMatchSnapshot('productsResult')
      })
  })
})

it('can analyze schema for inline csv', async () => {
  const sampleCsv = await parseCsv(`id,name,role,email,createdAt,accountConfirmed
1,Eve,poweruser,eve@example.com,2020-01-20,undefined
2,Alice,user,ali@example.com,2020-02-02,true
3,Bob,user,robert@example.com,2019-12-31,true
4,Elliot Alderson,admin,falkensmaze@protonmail.com,2001-01-01,false
5,Sam Sepiol,admin,falkensmaze@hotmail.com,9/9/99,true`)

  return schemaBuilder('sampleCsv', sampleCsv)
    .then((result) => {
      // if (!isCI) console.log(JSON.stringify(result, null, 2))
      expect(result).toMatchSnapshot('accountsCsvResult')
    })
})

it('can analyze schema for ./people.json', () => {
  const people = JSON.parse(fs.readFileSync(path.resolve(__dirname, './__tests__/swapi-people.json'), 'utf8'))
  people[0].created = new Date(people[0].created)
  people[1].created = new Date('0000-01-01')
  people[2].created = new Date('x')
  return schemaBuilder('people', people)
    .then((result) => {
      // if (!isCI) console.log('people', JSON.stringify(result, null, 2))
      expect(result).toMatchSnapshot('peopleResult')
    })
})

it('number range analysis handles invalid data', () => {
  expect(getNumberRangeStats(null)).toBeUndefined()
})

function parseCsv (content) {
  return new Promise((resolve, reject) => {
    csvParse(
      content,
      {
        columns: true,
        trim: true,
        skip_empty_lines: true
      },
      (err, results, info) => {
        if (err) return reject(err)
        resolve(results)
      }
    )
  })
}
