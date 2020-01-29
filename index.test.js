import { schemaBuilder, condenseFieldData, getNumberRangeStats } from './index.js'
import path from 'path'
import fs from 'fs'
import csvParse from 'csv-parse'

it('handles missing arguments', () => {
  expect(() => schemaBuilder([{}])).toThrowError(/must be a String/)
  expect(() => schemaBuilder('test', null)).toThrowError(/must be an Array/)
})

it('can analyze schema for ./users.json', () => {
  const users = JSON.parse(fs.readFileSync(path.resolve(__dirname, './__tests__/users.example.json'), 'utf8'))
  return schemaBuilder('users', users)
  .then(result => expect(result).toMatchSnapshot('usersResult'))
})

it('can analyze schema for ./properties.json', () => {
  const properties = JSON.parse(fs.readFileSync(path.resolve(__dirname, './__tests__/real-estate.example.json'), 'utf8'))
  return schemaBuilder('properties', properties)
  .then(result => expect(result).toMatchSnapshot('propertiesResult'))
})

it('can analyze schema for ./products.csv', () => {
  const productCsv = parseCsv(fs.readFileSync(path.resolve(__dirname, './__tests__/products-3000.csv'), 'utf8'))
  return productCsv.then(products => {
    return schemaBuilder('products', products)
      .then(result => expect(result).toMatchSnapshot('productsResult'))
  })
})

it('can analyze schema for ./products.csv', async () => {
  const sampleCsv = await parseCsv(`id,name,role,email,createdAt,accountConfirmed
1,Eve,poweruser,eve@example.com,01/20/2020,false
2,Alice,user,ali@example.com,02/02/2020,true
3,Bob,user,robert@example.com,12/31/2019,true
4,Elliot Alderson,admin,falkensmaze@protonmail.com,01/01/2001,false
5,Sam Sepiol,admin,falkensmaze@hotmail.com,9/9/99,true`)

  return schemaBuilder('accountsCsv', sampleCsv)
    .then(result => {
      // console.log(JSON.stringify(result, null, 2))
      expect(result).toMatchSnapshot('accountsCsvResult')
    })
})

it('can analyze schema for ./people.json', () => {
  const people = JSON.parse(fs.readFileSync(path.resolve(__dirname, './__tests__/swapi-people.json'), 'utf8'))
  return schemaBuilder('people', people)
  .then(result => expect(result).toMatchSnapshot('peopleResult'))
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

// const uniques = {
//   title: ['lorem ipsum dolor sit amet', 'amit ipsum dolor sit amet', 'amit ipsum dolor sit Lorem ipsum', 'amit Lorem ipsum amit dolor amet'],
//   status: ['active', 'inactive'],
//   features: [],
//   listPrice: [],
//   salePrice: [],
//   estimatedPrice: []
// }
// const fieldInfoByKey = {
//   title: [{
//     String: { rank: 1, length: 20 }
//   }, {
//     String: { rank: 1, length: 50 }
//   }, {
//     String: { rank: 1, length: 40 }
//   }, {
//     String: { rank: 1, length: 66 },
//     Null: { rank: 2 }
//   }, {
//     Null: {}
//   }
//   ],
//   status: [
//     { String: { rank: 1, length: 6 } },
//     { String: { rank: 1, length: 6 } },
//     { String: { rank: 1, length: 6 } },
//     { String: { rank: 1, length: 6 } },
//     { String: { rank: 1, length: 8 } },
//     { String: { rank: 1, length: 8 } }
//   ],
//   features: [
//     { Array: { length: 2 } },
//     { Array: { length: 1 } },
//     { Array: { length: 0 } },
//     { Array: { length: 10 } },
//     { Array: { length: 18 } }
//   ],
//   listPrice: [{
//     Float: { scale: 7, precision: 2 },
//     String: { length: 8 }
//   }, {
//     Float: { scale: 9, precision: 2 },
//     String: { length: 10 }
//   }, {
//     Float: { scale: 2, precision: 2 }
//   }, {
//     Float: { scale: 4, precision: 2 },
//     String: { length: 5 }
//   }, {
//     Float: { scale: 4, precision: 2 },
//     String: { length: 5 }
//   }
//   ],
//   salePrice: [{
//     Float: { scale: 7, precision: 2 }
//   }, {
//     Float: { scale: 6, precision: 2 }
//   }, {
//     Number: { length: 4 },
//     String: { length: 4 }
//   }, {
//     Float: { scale: 4, precision: 2 },
//     String: { length: 5 }
//   }, {
//     Float: { scale: 5, precision: 2 },
//     String: { length: 6 }
//   }
//   ],
//   estimatedPrice: [{
//     Float: { scale: 5, precision: 2 },
//     String: { length: 6 }
//   }, {
//     Number: { length: 6 },
//     String: { length: 3 }
//   }, {
//     Float: { scale: 5, precision: 2 }
//   }, {
//     Float: { scale: 5, precision: 2 }
//   }, {
//     Float: { scale: 5, precision: 2 },
//     String: { length: 2 }
//   }
//   ]
// }
