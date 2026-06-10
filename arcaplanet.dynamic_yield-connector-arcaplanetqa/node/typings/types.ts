export interface ProductData {
  unit_pricing_measure?:string
  unit_pricing_base_measure?:string
    product_id:string
    reference?:string
    title?:string
    brand?:string
    link?:string
    description?:string
    ean?:string
    category?:string
    sale_price_arcaplanet?: number
    barred_price_arcaplanet?:number
    price_including_tax_arcaplanet?:number
    isAvailable_arcaplanet?:number
    bullet_points?:string
    keywords?:string
    measurement_unit?:string
    unit_multiplier?:number
    product_type?:string
    image_url_1?:string
    image_url_2?:string
    parent_id?:string
    sku_id?:string
    sku_link?: string
    sub_category1?:string
    sub_category2?:string
    sub_category3?:string
    sub_category4?:string
    sub_category5?:string
    sub_category6?:string
  }