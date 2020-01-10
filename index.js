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
			let categories = []

			let categoriesFromAvailableFilters = await data.available_filters.filter(
				filter => filter.id === 'category'
			)
			let categoriesFromFilters = await data.filters.filter(
				filter => filter.id === 'category'
			)

			if (categoriesFromAvailableFilters.length > 0) {
				categories = categoriesFromAvailableFilters[0].values.map(
					({ name }) => name
				)
			} else if (categoriesFromFilters.length > 0) {
				categories = categoriesFromFilters[0].values.map(({ name }) => name)
			}

			console.log('categories1', categoriesFromAvailableFilters)
			console.log('categories2 ', categoriesFromFilters)

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
		console.log('error', error)

		res
			.status(404)
			.send('No se pudo obtener correctamente los datos de Mercado Libre')
	}
})

app.get('/api/items/:id', async function(req, res) {
	try {
		const response1 = await fetch(
			`https://api.mercadolibre.com/items/${req.params.id}`
		)
		const data1 = await response1.json()

		const response2 = await fetch(
			`https://api.mercadolibre.com/items/${req.params.id}/descriptions`
		)
		const data2 = await response2.json()

		const response3 = await fetch(
			`https://api.mercadolibre.com/categories/${data1.category_id}`
		)
		const data3 = await response3.json()

		const paths = await data3.path_from_root.map(path => path.name)

		const formatPrice = await {
			intPart: Math.trunc(data1.price),
			decPart: Number((data1.price - Math.trunc(data1.price)).toFixed(2))
		}

		const product = {
			author: { name: 'Francisco', lastname: 'Rodriguez' },
			item: {
				id: data1.id,
				title: data1.title,
				price: {
					currency: data1.currency_id,
					amount: formatPrice.intPart,
					decimals: formatPrice.decPart
				},
				picture: data1.pictures[0].url,
				condition: data1.condition,
				free_shipping: data1.shipping.free_shipping,
				sold_quantity: data1.sold_quantity,
				description: data2[0].plain_text,
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
