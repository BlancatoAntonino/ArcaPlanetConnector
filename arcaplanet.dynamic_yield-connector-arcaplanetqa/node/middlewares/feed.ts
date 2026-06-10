import { UserInputError } from '@vtex/api'
//const fs = require('fs');

import { ProductData } from 'typings/types'
import { processJSONtoCSV, processJSONtoXML_BatchMode, stringify } from '../utils/feedutils'
import { getRandomReference } from '../utils/functions'

export async function feed(ctx: Context, next: () => Promise<void>) {
  const {
    clients: { feedManager },
    state: {
      appSettings: { feedFormat }
    }
  } = ctx

  const OperationID = getRandomReference();

  try {

    const feedStatus = await feedManager.getStatus()
    if (feedStatus && !feedStatus.completed) {
      ctx.status = 200
      ctx.body = 'Feed generation in progress'
    }

    ctx.state.logger.info(`Retrieve feed - NEW REQUEST - OperationID: ${OperationID}`)

    let products: ProductData[] = []

    // Retrieve products from all chunk (document in VBase) based on Index document
    const vBase_ProductPaths = await feedManager.getFeedJSON_Index();
    if (vBase_ProductPaths && vBase_ProductPaths?.length > 0) {

      let promises = []
      for (let i = 0; i < vBase_ProductPaths.length; i++) {
        promises.push(feedManager.getFeedJSON(vBase_ProductPaths[i]))
      }

      let productArray = await Promise.all(promises)
      productArray.forEach((array: any) => {
        products = products.concat(array)
      })

    } else {
      products = await feedManager.getFeedJSON()
    }

    // Check on products existence
    if (!products?.length || products.length <= 0) {
      throw new UserInputError('No product feed has been found')
    }

    if (feedFormat === 'json') {

      if (ctx.query.download == 'true') {
        ctx.set('Content-Disposition', 'attachment; filename="feed.json"')
      } else {
        ctx.set('Content-Disposition', 'inline')
      }

      ctx.response.body = products;

    } else if (feedFormat === 'xml') {

      // Convert JSON in XML string
      let xmlDocument = processJSONtoXML_BatchMode(products)

      ctx.set('Content-Type', 'text/xml')
      if (ctx.query.download == 'true') {
        ctx.set('Content-Disposition', 'attachment; filename="feed.xml"')
      } else {
        ctx.set('Content-Disposition', 'inline')
      }

      ctx.response.body = xmlDocument;

    } else {
      // Convert JSON in XML string
      let xmlDocument = await processJSONtoCSV(products)

      ctx.set('Content-Type', 'text/csv')

      if (ctx.query.download == 'true') {
        ctx.set('Content-Disposition', 'attachment; filename="feed.csv"')
      } else {
        ctx.set('Content-Disposition', 'inline')
      }

      ctx.response.body = xmlDocument;

    }

    // VBase cache improvement TBD REMINDER

    /*  
    
    fs.appendFileSync("./feed.xml", partialFeed); //append file writeasync....
   
     await ctx.clients.vbase.saveFile("testb", "testpath", fs.createReadStream("./feed.xml"), true)
     let vbaseFile = await ctx.clients.vbase.getFile("testb", "testpath")
   
     let stringFile = vbaseFile.data
   
     console.log("vbaseFile:", stringFile) 
     
     */

    // END VBASE CHACHE IMPROVEMENTS

    ctx.state.logger.info(`Retrieve feed - RESPONSE SENT - OperationID: ${OperationID}`)

    ctx.response.status = 200;

    await next()

  } catch (error) {

    let msg = error.response?.data ? (stringify(error.response?.data)) : (stringify(error));
    ctx.state.logger.error(`Retrieve feed - OperationID: ${OperationID} - Error:` + msg);
    ctx.status = 500;

  }

}

export async function getCurrentFeed(ctx: Context) {
  const {
    clients: { feedManager },
  } = ctx

  try {

    const feedStatus = await feedManager.getStatus()
    if (feedStatus && !feedStatus.completed) {
      ctx.status = 200
      ctx.body = 'Feed generation in progress'
    } else {
      ctx.status = 200
    }


    let products: ProductData[] = []

    // Retrieve products from all chunk (document in VBase) based on Index document
    const vBase_ProductPaths = await feedManager.getFeedJSON_Index();
    if (vBase_ProductPaths && vBase_ProductPaths?.length > 0) {

      let promises = []
      for (let i = 0; i < vBase_ProductPaths.length; i++) {
        promises.push(feedManager.getFeedJSON(vBase_ProductPaths[i]))
      }

      let productArray = await Promise.all(promises)
      productArray.forEach((array: any) => {
        products = products.concat(array)
      })

    } else {
      products = await feedManager.getFeedJSON()
    }

    // Check on products existence
    if (!products?.length || products.length <= 0) {
      throw new UserInputError('No product feed has been found')
    }

    return products;

  } catch (error) {
     ctx.state.logger.error(
      `GetCurrent feed error -> ${stringify(error)}`
    );
    return []
  }

}
