const express = require('express')
const path = require('path')
const compression = require('compression')
const async = require('express-async-await')
const fetch = require('node-fetch')
const port = process.env.PORT || 5000
const app = express()

app.use(compression())
app.use(function(req, res, next) {
	var allowedOrigins = ['http://localhost:3000', 'https://mercadolibre.now.sh']
	var origin = req.headers.origin
	if (allowedOrigins.indexOf(origin) > -1) {
		res.setHeader('Access-Control-Allow-Origin', origin)
	}
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, OPTIONS, PUT, PATCH, DELETE'
	)
	res.setHeader(
		'Access-Control-Allow-Headers',
		'X-Requested-With, Content-Type'
	)
	res.setHeader('Access-Control-Allow-Credentials', true)
	next()
})

app.get('/api/trends', async function(req, res) {
	try {
		const response = await fetch('https://api.mercadolibre.com/trends/MLA', {
			headers: { 'Accept-Encoding': 'br' }
		})
		const data = await response.json()
		const trends = await data.map(trend => {
			let item = {
				keyword: trend.keyword,
				url: trend.url
			}
			return item
		})
		res.json({ trends: trends })
	} catch {
		res
			.status(404)
			.send('No se pudo obtener correctamente los datos de Mercado Libre')
	}
})

app.get('/api/items', async function(req, res) {
	try {
		const response = await fetch(
			`https://api.mercadolibre.com/sites/MLA/search?q=${req.query.q}&limit=4`
		)
		const data = await response.json()

		if (data.results.length === 0) {
			res.status(204).send(`No se obtubieron resultados de ${req.query.q}`)
		} else {
			const categories = await data.available_filters[0].values.map(
				category => category.name
			)
			// let categories = []

			// let categoriesFromAvailableFilters = await data.available_filters.filter(
			// 	filter => filter.id === 'category'
			// )
			// let categoriesFromFilters = await data.filters.filter(
			// 	filter => filter.id === 'category'
			// )

			// if (categoriesFromAvailableFilters.length > 0) {
			// 	categories = categoriesFromAvailableFilters[0].values.map(
			// 		({ name }) => name
			// 	)
			// } else if (categoriesFromFilters.length > 0) {
			// 	categories = categoriesFromFilters[0].values.map(({ name }) => name)
			// }

			const items = await data.results.map(result => {
				let formatPrice = {}
				if (/\./.test(String(result.price))) {
					formatPrice.intPart = Number(String(result.price).split('.')[0])
					formatPrice.decPart = Number(String(result.price).split('.')[1])
				} else {
					formatPrice.intPart = result.price
					formatPrice.decPart = 0
				}

				let item = {
					id: result.id,
					title: result.title,
					price: {
						currency: result.currency_id,
						amount: formatPrice.intPart,
						decimals: formatPrice.decPart
					},
					picture: result.thumbnail.replace('http', 'https'),
					condition: result.condition,
					free_shipping: result.shipping.free_shipping,
					city: result.address.state_name
				}
				return item
			})
			const final = {
				author: {
					name: 'Francisco',
					lastname: 'Rodriguez'
				},
				categories: categories,
				items: items
			}
			res.json(final)
		}
	} catch (error) {
		res
			.status(404)
			.send('No se pudo obtener correctamente los datos de Mercado Libre')
	}
})

app.get('/api/items/:id', async function(req, res) {
	try {
		const [productResponse, descriptionResponse] = await Promise.all([
			fetch(`https://api.mercadolibre.com/items/${req.params.id}`),
			fetch(`https://api.mercadolibre.com/items/${req.params.id}/descriptions`)
		])

		const productData = await productResponse.json()

		const descriptionData = await descriptionResponse.json()

		const categoriesResponse = await fetch(
			`https://api.mercadolibre.com/categories/${productData.category_id}`
		)
		const categoriesData = await categoriesResponse.json()

		const paths = await categoriesData.path_from_root.map(path => path.name)

		let formatPrice = {}
		if (/\./.test(String(productData.price))) {
			formatPrice.intPart = Number(String(productData.price).split('.')[0])
			formatPrice.decPart = Number(String(productData.price).split('.')[1])
		} else {
			formatPrice.intPart = productData.price
			formatPrice.decPart = 0
		}

		const product = {
			author: { name: 'Francisco', lastname: 'Rodriguez' },
			item: {
				id: productData.id,
				title: productData.title,
				price: {
					currency: productData.currency_id,
					amount: formatPrice.intPart,
					decimals: formatPrice.decPart
				},
				picture: productData.pictures[0].url.replace('http', 'https'),
				condition: productData.condition,
				free_shipping: productData.shipping.free_shipping,
				sold_quantity: productData.sold_quantity,
				description: descriptionData[0].plain_text,
				categories: paths
			}
		}
		res.json(product)
	} catch {
		res
			.status(404)
			.send('No se pudo obtener correctamente los datos de Mercado Libre')
	}
})

app.listen(port, () => {
	console.log('Meli server is listening on port ' + port)
})
