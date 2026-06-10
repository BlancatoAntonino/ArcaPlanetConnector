/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import { Tenant } from '@vtex/api'
import axios from 'axios'
import { Ean13Utils } from 'ean13-lib'
import { json2csv } from 'json-2-csv'
import convert from 'xml-js'
import { ProductData } from '../typings/types'
import { PRODUCT_CHUNK_SIZE_SAVE_JSON } from './constants'
import { isValid } from './functions'
import { getProductsFromCatalog } from './tempFeedUtil'
import { XMLParser } from 'fast-xml-parser'

const ONE_MINUTE = 60 * 1000

export async function getProducts_Json(ctx: Context) {

  try {

    const res = (await ctx.clients.catalogSystem.fetchXML_Products())
    const pd: any = (convertXmlToJsonV2(res))

    return pd.catalogue.products

  } catch (error) {
    return error
  }
}

export const getCircularReplacer = () => {
  const seen = new WeakSet();
  return ({ }, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
}

export function stringify(data: any): string {
  return typeof data == "object" ? JSON.stringify(data, getCircularReplacer()) == "{}" ? data : JSON.stringify(data, getCircularReplacer()) : data;
}

export const pacer = (callsPerMinute: number) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve('done')
    }, ONE_MINUTE / callsPerMinute)
  })

/**
 *
 * @param object Json object to be converted to xml
 * @returns XML data
 */
export const convertJsonToXML = (object: any) => {
  let result = convert.json2xml(JSON.stringify(object), {
    compact: true,
    ignoreComment: true,
    spaces: 4,
  })

  result = `${result}`

  return result
}

/**
 * Iterate over <products> nodes in a large XML payload and yield JS objects batches
 * without parsing the entire XML into memory.
 */
export function* iterateProductBatchesFromXML(xmlData: string, batchSize: number): Generator<any[], void, unknown> {
  // Match each <products> ... </products> block
  const productTagRegex = /<products\b[\s\S]*?<\/products>/g;

  let match: RegExpExecArray | null;
  let collectedXmlNodes: string[] = [];

  while ((match = productTagRegex.exec(xmlData)) !== null) {
    collectedXmlNodes.push(match[0]);
    if (collectedXmlNodes.length >= batchSize) {
      const miniXml = `<?xml version="1.0" encoding="utf-8"?><catalogue>${collectedXmlNodes.join('')}</catalogue>`;
      const parsed = convertXmlToJsonV2<any>(miniXml);
      const products = Array.isArray(parsed?.catalogue?.products)
        ? parsed.catalogue.products
        : parsed?.catalogue?.products
          ? [parsed.catalogue.products]
          : [];
      collectedXmlNodes = [];
      yield products;
    }
  }

  if (collectedXmlNodes.length > 0) {
    const miniXml = `<?xml version="1.0" encoding="utf-8"?><catalogue>${collectedXmlNodes.join('')}</catalogue>`;
    const parsed = convertXmlToJsonV2<any>(miniXml);
    const products = Array.isArray(parsed?.catalogue?.products)
      ? parsed.catalogue.products
      : parsed?.catalogue?.products
        ? [parsed.catalogue.products]
        : [];
    collectedXmlNodes = [];
    yield products;
  }
}

/**
 *
 * @param xmlData XML data to be converted to JSON
 * @returns JSON data
 */
export const convertXmlToJson = <JsonType>(xmlData: string) => {
  const convertedData = convert.xml2json(xmlData, {
    ignoreComment: true,
    alwaysChildren: true,
    compact: true,
  })

  return JSON.parse(convertedData) as JsonType
}

export const checkValidEan = (ean: any) => {
  let isValidGTIN = false

  try {
    isValidGTIN = Ean13Utils.validate(ean)
  } catch (err) {
    console.error(err)
  }

  return isValidGTIN
}

export const convertXmlToJsonV2 = <JsonType>(xmlData: string) => {
  // Parse XML directly to JS object to avoid a giant JSON string in memory
  const parser = new XMLParser({
    ignoreAttributes: true,
    attributeNamePrefix: '',
    textNodeName: '_text',
    trimValues: true,
  })
  const parsedRaw: any = parser.parse(xmlData)

  // Normalize nodes: collapse {_text}, convert numeric-keyed objects to arrays
  const normalize = (node: any): any => {
    if (node && typeof node === 'object') {
      const keys = Object.keys(node)
      if (keys.length === 1 && keys[0] === '_text') {
        return node._text
      }
      const isNumericKeyed = keys.length > 0 && keys.every((k) => /^\d+$/.test(k))
      if (isNumericKeyed) {
        const sorted = keys.sort((a, b) => parseInt(a) - parseInt(b))
        const arr: any[] = new Array(sorted.length)
        for (let i = 0; i < sorted.length; i++) arr[i] = normalize(node[sorted[i]])
        return arr
      }
      for (const k of keys) node[k] = normalize(node[k])
      return node
    }
    return node
  }
  const parsed = normalize(parsedRaw)

  const RemapArray = (parsed: any): any => {// Ensure that item.referenceId and item.variations are always arrays if they exist and are not already arrays
    if (parsed && parsed.catalogue) {
      // products -> ensure array
      if (parsed.catalogue.products && !Array.isArray(parsed.catalogue.products)) {
        parsed.catalogue.products = [parsed.catalogue.products]
      }

      if (Array.isArray(parsed.catalogue.products)) {
        parsed.catalogue.products.forEach((product: any) => {
          // categories and categoriesIds -> ensure arrays
          if (product.categories && !Array.isArray(product.categories)) {
            product.categories = [product.categories]
          }
          if (product.categoriesIds && !Array.isArray(product.categoriesIds)) {
            product.categoriesIds = [product.categoriesIds]
          }

          // allSpecifications -> ensure array
          if (product.allSpecifications && !Array.isArray(product.allSpecifications)) {
            product.allSpecifications = [product.allSpecifications]
          }

          // items -> ensure array
          if (product.items && !Array.isArray(product.items)) {
            product.items = [product.items]
          }

          if (product.items && Array.isArray(product.items)) {
            product.items.forEach((item: any) => {
              // referenceId -> ensure array
              if (item.referenceId && !Array.isArray(item.referenceId)) {
                item.referenceId = [item.referenceId]
              }

              // variations -> ensure array
              if (item.variations && !Array.isArray(item.variations)) {
                item.variations = [item.variations]
              }

              // images -> ensure array
              if (item.images && !Array.isArray(item.images)) {
                item.images = [item.images]
              }

              // sellers -> ensure array
              if (item.sellers && !Array.isArray(item.sellers)) {
                item.sellers = [item.sellers]
              }
            })
          }
        })
      }
    }

    return parsed
  }

  return RemapArray(parsed) as JsonType

}

/**
 *
 * @param xmlData Products XML data
 * @returns List of product IDs
 */
export const getProductIdsFromXML = (xmlData: string) => {
  const convertedData = convertXmlToJson<ConvertedXMLData>(xmlData)
  const {
    products: { product },
  } = convertedData

  return product.map((item: XMLDataProduct) => item.id_product._cdata)
}

const generateChildren = (string: any, counter: any) => {
  const childrenQuery = `
    children{
        id,
        name,`

  if (counter > 0) {
    string += generateChildren(childrenQuery, counter - 1)
    string += `}`
  }

  return string
}

export const getCategoryQuery = (childrenLevel: any) => {
  const categoryQuery = `
        query{
            categories(treeLevel:15) {
                id,
                name,
                ${generateChildren('', childrenLevel)}
            }
        } `

  return categoryQuery
}

export const followUpCategory = (
  category: any,
  parent = '',
  arrayCategories: { [key: string]: any } = []
) => {
  let categoryParentString = ''
  categoryParentString = parent ? `${parent}/${category.id}` : category.id

  arrayCategories.push(categoryParentString)

  if (category.children && category.children.length > 0) {
    category.children.map((children: any) => {
      arrayCategories = followUpCategory(
        children,
        categoryParentString,
        arrayCategories
      )
    })
  }

  return arrayCategories
}

export const queryProduct = (
  salesChannel: any,
  from: any,
  to: any,
  category: any
  // eslint-disable-next-line max-params
) => {
  return `
        query{
              products(salesChannel: "${salesChannel}", from:${from}, to: ${to}, category: "${category}"){
                productId,
                productName,
                brand,
                link,
                productId,
                description,
                metaTagDescription,
                categories,

                items {
                  itemId
                  name
                  nameComplete
                  complementName
                  ean
                  measurementUnit
                  images {
                    imageUrl
                    imageLabel
                  },
                  sellers{
                    commertialOffer{
                      Price,
                      ListPrice,
                      AvailableQuantity
                    }
                  }
                  variations {
                    name,
                    values
                  },
                }
              }
            }
            `
}

export const formatProductsForFeed = (
  productsToFormat: any,
  appSettings: any,
  account: any
) => {
  let numSKUSParent = 0
  let numSKUSSimple = 0
  let numSKUSChild = 0
  let validGTIN = 0
  let numSKUSItems = 0
  let numSKUFeed = 0
  const products: any[] = []

  const excludeOutStock = appSettings.flagExportOutOfStockSKU
  const checkvalidGTINFlag = appSettings.flagCheckValidGTIN

  const productsDataCustomFields = JSON.parse(appSettings.productDataCustomFields)
  const productSpecs = JSON.parse(appSettings.productSpecifications)

  productsToFormat.map((product: any) => {
    // Removing VT char to avoid XML syntax errors
    // eslint-disable-next-line no-control-regex
    product.description = product.description.replace(//gi, '')

    if (!Array.isArray(product.items)) {
      product.items = [product.items];
    }

    product.items.map((item: any) => {
      const unit_multiplier = isValid(item?.unitMultiplier) ? item.unitMultiplier : 1
      const sellingPrice = (item.sellers[0].commertialOffer.Price * unit_multiplier)

      let isValidGTIN = true
      isValidGTIN = checkValidEan(item.ean)

      if (!checkvalidGTINFlag || isValidGTIN) {

        const foundIndex2 = products.findIndex((productFind: any) => {
          return (
            productFind.product_id === `${product.productId}-${item.itemId}`
          )
        })

        if (foundIndex2 < 0) { //TODO: valutare se tenere o no il controllo

          const imageSkuURL: { [key: string]: any } = {}
          if (
            typeof item.images !== 'undefined' &&
            item.images &&
            item.images.length > 0
          ) {
            let pos = 0
            for (let i = 0; i < item.images.length; i++) {
              if (item.images[i].imageLabel === 'AMZ_LoP_mainImage') {
                // set position of main image for Lion of Porches Amazon Integration
                pos = i
              }
            }
            // set other images in proper sequence
            for (let i = 0; i < item.images.length; i++) {
                  /* if (i < pos) {
                    // set image 1 position forward
                    imageSkuURL[`image_url_${i + 2}`] = item.images[i].imageUrl
                  } else */ if (i === pos) {
                // set main picture
                imageSkuURL.image_url = item.images[pos].imageUrl
              } /* else {
                    imageSkuURL[`image_url_${i + 1}`] = item.images[i].imageUrl
                  } */
            }
          }

          let productAux: any = {
            group_id: `${product.productId}`,
            sku: `${item.itemId}`,
            name: item.nameComplete,
            url: (product.link.replace(
              `${account}.vtexcommercestable.com.br`,
              appSettings.domainShop
            )).replace('/p', `-${item.itemId}/p`),

            categories: product.categories[0]
              .replace(/^\/+|\/+$/g, '')
              .split('/')
              .join('|'),
            [`price`]: sellingPrice,
            [`in_stock`]: item.sellers[0]
              .commertialOffer.AvailableQuantity > 0,

          }

          productAux = { ...productAux, ...imageSkuURL }

          let keywords = ''

          for (const customField of productsDataCustomFields) {

            if (customField.specName?.split("-")[0] === 'category') {
              const catLevel = parseInt(customField.specName.split("-")[1])

              keywords = customField?.flagShowKeyword ? productAux.categories.split('|')[catLevel - 1] : ''
              if (customField?.flagCustomProp) {
                productAux[customField.specXML] =
                  productAux.categories.split('|')[catLevel - 1]
              }

            }
            else {
              productAux[customField.specXML] =
                product[customField.specName]
            }

          }

          product.allSpecifications &&
            product.allSpecifications.map((specification_name: any) => {
              if (productSpecs && productSpecs.length > 0) {
                const productSpecExport = productSpecs.find(
                  (spec: any) => spec.specName === specification_name
                )

                if (productSpecExport) {

                  const specValue = Array.isArray(product[specification_name]) ? product[specification_name][0] : product[specification_name]

                  if (productSpecExport?.flagCustomProp) {
                    productAux[productSpecExport.specXML] = specValue
                  }

                  if (productSpecExport?.flagShowKeyword) {
                    keywords = (keywords == '') ? specValue : keywords.concat(`|${specValue}`);
                  }
                }
              }
            })

          productAux = {
            ...productAux,
            keywords
          }

          if (
            (excludeOutStock &&
              item.sellers[0].commertialOffer.AvailableQuantity > 0) ||
            !excludeOutStock
          ) {
            products.push(productAux)
            numSKUSItems += 1
            if (isValidGTIN) {
              validGTIN += 1
            }
            numSKUFeed++
          }

        } else {
          products[foundIndex2][`price`] = sellingPrice;
          products[foundIndex2][`in_stock`] =
            item.sellers[0].commertialOffer.AvailableQuantity > 0
        }
      }
    })

  })



  return {
    products,
    numSKUSParent,
    numSKUSChild,
    numSKUSSimple,
    validGTIN,
    numSKUSItems,
    numSKUFeed,
  }
}

export const getProductsByLocale = async (
  account: string,
  productId: string,
  locale: string,
  canonicalBaseAddress: string
) => {
  const query = JSON.stringify({
    query: `query {
      productsByIdentifier(field: id, values:${productId}) @context(provider: "vtex.search-graphql"){
        productId,
        productName,
        brand,
        link,
        linkText,
        metaTagDescription,
        description,
        categoryTree {
          name
        }
        items {
          itemId
          name
        }
        skuSpecifications {
          field {
            originalName
            name
          }
          values {
            originalName
            name
          }
        }
        properties {
          originalName
          name
          values
        }
      }
    }`,
  })

  const bindingAddress =
    canonicalBaseAddress.indexOf('/') < 0
      ? `${canonicalBaseAddress}/`
      : canonicalBaseAddress

  const config = {
    method: 'post',
    url: `http://${account}.myvtex.com/_v/private/graphql/v1?locale=${locale}&__bindingAddress=${bindingAddress}`,
    headers: {
      'Content-Type': 'application/json',
    },
    data: query,
  }

  try {
    const { data } = await axios(config)
    return data.data.productsByIdentifier
  } catch (error) {
    console.error(JSON.stringify(error.response.data, null, 2))
    return false
  }
}

// const formatLocaleToName = (locale: string) => {
//   return locale.replace(/-/g, '_').toLocaleLowerCase()
// }

/**
 *
 * @param tenantInfo Tenant information
 * @returns Tenant's store-front bindings
 */
export const getStoreFrontBindings = (tenantInfo: Tenant) =>
  tenantInfo.bindings.filter(
    (binding) => binding.targetProduct === 'vtex-storefront'
  )

interface AddLocalizedContentParams {
  account?: string
  locale: string
  product: any
  canonicalPath: string
  productSpecs?: Specification[]
  skuSpecs?: Specification[]
  translatedProducts: any
}

interface Specification {
  id: string
  specName: string
  specXML: string
}

export const addLocalizedContent = async ({
  locale,
  product,
  canonicalPath,
  translatedProducts,
  productSpecs,
  skuSpecs,
}: AddLocalizedContentParams) => {
  const productByLocale = translatedProducts.filter(
    (translatedProduct: any) =>
      translatedProduct.productId === product.product_id.split('-')[0]
  )

  if (!productByLocale) {
    return false
  }

  const productIdParts = product.product_id.split('-')

  let productName
  // comprobando si es un producto o una variante
  if (productIdParts.length === 1) {
    // producto
    productName = productByLocale[0].productName
  } else {
    // variante

    let index = 0
    while (
      index < productByLocale[0].items?.length &&
      productByLocale[0].items[index]?.itemId !== productIdParts[1]
    ) {
      index++
    }
    if (productByLocale[0].items[index].itemId === productIdParts[1]) {
      productName = productByLocale[0].items[index].name
    }
  }

  const localizedProductLink = productByLocale[0].linkText
  const canonicalAddress =
    canonicalPath.substr(-1) !== '/' ? `${canonicalPath}/` : canonicalPath
  const localizedLink = `https://${canonicalAddress}${localizedProductLink}/p`

  const result = {
    product_id: product.product_id,
    reference: product.reference,
    [`title_${locale}`]: productName,
    [`brand_${locale}`]: productByLocale[0].brand,
    [`link_${locale}`]: localizedLink,
    [`description_${locale}`]: productByLocale[0].description,
    [`bullet_points_${locale}`]: productByLocale[0].metaTagDescription,
    [`keywords_${locale}`]: productByLocale[0].metaTagDescription,
    ...product,
  }

  delete result.title
  delete result.brand
  delete result.link
  delete result.description
  delete result.bullet_points
  delete result.keywords

  const [{ categoryTree }] = productByLocale
  const categories = categoryTree.map((category: any) => category.name)

  result[`category_${locale}`] = categories.join('|')
  delete result.category

  /*  for (let index = 0; index < categories.length; index++) {
     result[`sub_category${index + 1}_${locale}`] = categories[index]
     delete result[`sub_category${index + 1}`]
   } */

  if (productSpecs?.length && productByLocale[0].properties.length) {
    for (const specification of productSpecs) {
      const specName = `${specification.specXML}_${locale}`.replace(' ', '_')

      // eslint-disable-next-line prefer-destructuring
      const specValue = productByLocale[0].properties.find(
        (prop: any) => prop.originalName === specification.specName
      )

      delete result[specification.specXML]

      if (specValue) {
        result[specName] = specValue.values[0]
      }
    }
  }

  if (skuSpecs?.length && productByLocale[0].skuSpecifications.length) {
    for (const specification of skuSpecs) {
      const specName = `${specification.specXML}_${locale}`.replace(' ', '_')

      const specObject = productByLocale[0].skuSpecifications.find(
        (spec: any) => spec.field.originalName === specification.specName
      )

      if (!specObject) {
        continue
      }

      const specValue = specObject?.values.find(
        (value: any) => value.originalName === product[specification.specXML]
      )

      delete result[specification.specXML]

      if (specValue) {
        result[specName] = specValue.name
      }
    }
  }

  return result
}

export const processBatch = async (ctx: Context, batch: any[], sellerData: any) => {
  const formattedProducts: any[] = []

  batch.map((product) => {

    try {

      // Format products and add to the result
      const formatted = formatProductsForFeed(
        [product],
        ctx.state.appSettings,
        ctx.vtex.account
      )
      formattedProducts.push(...formatted.products);
    } catch (error) {
      ctx.state.productsInError.push(product.productId)
      ctx.state.logger.error(`Error processing products for a sales channel in the batch - productId: ${JSON.stringify(product, null)} - ${error}`)
    }
  })

  if (ctx.state.adminSettings.dynamicYield.isFranchiseStock_Enabled) {

    for (const product of formattedProducts) {

      const sellers = sellerData.get(product.sku)
      if (sellers && sellers.length > 0) {
        product.out_of_stock_branches = product?.out_of_stock_branches?.length > 0
          ? product.out_of_stock_branches.concat('|' + sellers.join('|'))
          : sellers.join('|')
      }
    }
  }

  return formattedProducts
}

export const processBatch1 = async (ctx: Context, batch: any[], sellerData: any) => {
  const salesChannels = JSON.parse(ctx.state.appSettings.salesChannel)
  const formattedProducts: any[] = []

  for (const productId of batch) {
    try {
      // Recupera i prodotti per ogni sales channel
      const productsPerSalesChannel = []
      for (const salesChannel of salesChannels) {
        try {
          const product = await getProductsFromCatalog(ctx, productId, salesChannel.id)
          productsPerSalesChannel.push({ marketplace: salesChannel.name, products: product })
        } catch (error) {
          // Logga solo se necessario
        }
      }

      // Format products e aggiungi solo quelli validi
      const formatted = formatProductsForFeed(
        productsPerSalesChannel.filter(Boolean),
        ctx.state.appSettings,
        ctx.vtex.account
      )

      // Aggiorna la disponibilità con la mappa SKU -> seller
      if (ctx.state.adminSettings.dynamicYield.isFranchiseStock_Enabled) {

        for (const product of formatted.products) {
          const sellers = sellerData.get(product.sku)
          if (sellers && sellers.length > 0) {
            product.out_of_stock_branches = product?.out_of_stock_branches?.length > 0
              ? product.out_of_stock_branches.concat('|' + sellers.join('|'))
              : sellers.join('|')
          }
        }
      }

      formattedProducts.push(...formatted.products)
      productsPerSalesChannel.length = 0
      if (formatted.products) formatted.products.length = 0

    } catch (error) {
      ctx.state.productsInError.push(productId)
      ctx.state.logger.error(`Error processing products for a sales channel in the batch - productId: ${productId} - ${error}`)
    }
  }

  return formattedProducts
}

// Useful to convert JSON of products in a XML string in batch
export function processJSONtoXML_BatchMode(products: ProductData[]) {

  // Initialize feed XML string
  let completeFeed = '<?xml version="1.0" encoding="utf-8"?><catalogue>'

  // Partially products to be converted in JSON, 
  // in order to avoid errors of heap out of memory.
  for (let i = 0; i < products.length; i += PRODUCT_CHUNK_SIZE_SAVE_JSON) {


    // Process product batch
    let batch = products.slice(i, i + PRODUCT_CHUNK_SIZE_SAVE_JSON)
    let partialFeed = convertJsonToXML({ products: batch })

    // Concat partial feed into finalFeed
    completeFeed = completeFeed.concat(partialFeed)

  }

  //add footer
  completeFeed = completeFeed.concat('</catalogue>')

  return completeFeed

}

export async function processJSONtoCSV(products: ProductData[]) {

  let completeFeed = json2csv(products, {
    emptyFieldValue: '',
  });

  return completeFeed

}
