import { schemaBuilder, getNumberRangeStats } from './index.js'
import path from 'path'
import fs from 'fs'
import csvParse from 'csv-parse'

const isCI = process.env.CI

it('handles missing arguments', () => {
  expect(() => schemaBuilder([{}, {}])).toThrowError(/requires at least 5/)
  expect(() => schemaBuilder(['test'])).toThrowError(/must be an Array of Objects/)
  expect(() => schemaBuilder('test')).toThrowError(/must be an Array/)
  expect(() => schemaBuilder(null)).toThrowError(/must be an Array/)
})

it('can analyze schema for ./users.json', () => {
  const users = JSON.parse(fs.readFileSync(path.resolve(__dirname, './__tests__/users.example.json'), 'utf8'))
  return schemaBuilder(users)
    .then(result => expect(result).toMatchSnapshot('usersResult'))
})

it('can analyze schema for ./properties.json', () => {
  const properties = JSON.parse(fs.readFileSync(path.resolve(__dirname, './__tests__/real-estate.example.json'), 'utf8'))
  return schemaBuilder(properties)
    .then(result => expect(result).toMatchSnapshot('propertiesResult'))
})

it('can analyze schema w/ enum options', () => {
  const properties = JSON.parse(fs.readFileSync(path.resolve(__dirname, './__tests__/real-estate.example.json'), 'utf8'))
  const lowEnumLimitLoosePct = schemaBuilder(properties, { enumMinimumRowCount: 10, enumAbsoluteLimit: 30, enumPercentThreshold: 0.2 })
    .then(result => expect(result).toMatchSnapshot('propertiesResult_lowEnumLimitLoosePct'))
  const lowEnumLimitLoose = schemaBuilder(properties, { enumMinimumRowCount: 10, enumAbsoluteLimit: 30 })
    .then(result => expect(result).toMatchSnapshot('propertiesResult_lowEnumLimitLoose'))
  const lowEnumLimit = schemaBuilder(properties, { enumMinimumRowCount: 10 })
    .then(result => expect(result).toMatchSnapshot('propertiesResult_lowEnumLimit'))
  const highEnumLimit = schemaBuilder(properties, { enumMinimumRowCount: 1000 })
    .then(result => expect(result).toMatchSnapshot('propertiesResult_highEnumLimit'))
  const highNullableLimit = schemaBuilder(properties, { nullableRowsThreshold: 0.25 })
    .then(result => expect(result).toMatchSnapshot('propertiesResult_highNullableLimit'))
  const lowNullableLimit = schemaBuilder(properties, { nullableRowsThreshold: 0 })
    .then(result => expect(result).toMatchSnapshot('propertiesResult_lowNullableLimit'))
  const notStrict = schemaBuilder(properties, { strictMatching: false })
    .then(result => expect(result).toMatchSnapshot('propertiesResult_notStrict'))
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
  return productCsv.then(products => {
    return schemaBuilder(products)
      .then(result => {
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

  return schemaBuilder(sampleCsv)
    .then(result => {
      if (!isCI) console.log(JSON.stringify(result, null, 2))
      expect(result).toMatchSnapshot('accountsCsvResult')
    })
})

it('can analyze schema for ./people.json', () => {
  const people = JSON.parse(fs.readFileSync(path.resolve(__dirname, './__tests__/swapi-people.json'), 'utf8'))
  return schemaBuilder(people)
    .then(result => {
      if (!isCI) console.log('people', JSON.stringify(result, null, 2))
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
