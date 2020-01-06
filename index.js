const express = require('express')
const cors = require('cors')
const path = require('path')
const compression = require('compression')
const async = require('express-async-await')
const fetch = require('node-fetch')
const port = process.env.PORT || 5000
const app = express()

var corsOptions = {
	origin: 'https://mercadolibre.now.sh',
	optionsSuccessStatus: 200
}

app.use(compression())

app.get('/api/trends', async function(req, res) {
	try {
		const response = await fetch(
			'https://api.mercadolibre.com/sites/mla/trends/search?limit=10',
			{ headers: { 'Accept-Encoding': 'br' } }
		)
		const data = await response.json()
		const trends = await data.map(trend => {
			let item = {
				keyword: trend.keyword,
				url: trend.url
			}
			return item
		})
		res.json(trends)
	} catch {
		res
			.status(404)
			.send('No se pudo obtener correctamente los datos de Mercado Libre')
	}
})

app.get('/api/items', cors(corsOptions), async function(req, res) {
	try {
		const response = await fetch(
			`https://api.mercadolibre.com/sites/MLA/search?q=${req.query.q}&limit=4`
		)
		const data = await response.json()
		const categories = await data.available_filters[0].values.map(
			category => category.name
		)
		const items = await data.results.map(result => {
			let formatPrice = {
				intPart: Math.trunc(result.price),
				decPart: Number((result.price - Math.trunc(result.price)).toFixed(2))
			}
			let item = {
				id: result.id,
				title: result.title,
				price: {
					currency: result.currency_id,
					amount: formatPrice.intPart,
					decimals: formatPrice.decPart
				},
				picture: result.thumbnail,
				condition: result.condition,
				free_shipping: result.shipping.free_shipping,
				city: result.address.state_name
			}
			return item
		})
		const final = await {
			author: {
				name: 'Francisco',
				lastname: 'Rodriguez'
			},
			categories: categories,
			items: items
		}
		res.json(final)
	} catch {
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
		const product = await {
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
