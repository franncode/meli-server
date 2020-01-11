const express = require('express')
const compression = require('compression')
const fetch = require('node-fetch')
const port = process.env.PORT || 5000
const app = express()
const proxy = 'https://api.mercadolibre.com'
const { formatItems, formatItem } = require('./formater')

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

app.get('/api/trends', async (req, res) => {
	try {
		const response = await fetch(`${proxy}/trends/MLA`, {
			headers: { 'Accept-Encoding': 'br' }
		})
		const data = await response.json()

		const trends = await data.map(({ keyword }) => keyword)

		res.json({ trends })
	} catch {
		res
			.status(404)
			.send('No se pudo obtener correctamente los datos de Mercado Libre')
	}
})

app.get('/api/items', async ({ query: { q } }, res) => {
	try {
		const response = await fetch(`${proxy}/sites/MLA/search?q=${q}&limit=4`)
		const data = await response.json()

		if (data.results.length === 0) {
			res.status(204).send(`No se obtubieron resultados de ${q}`)
		} else {
			const items = formatItems(data)
			res.json(items)
		}
	} catch (error) {
		res
			.status(404)
			.send('No se pudo obtener correctamente los datos de Mercado Libre')
	}
})

app.get('/api/items/:id', async (req, res) => {
	try {
		const [productResponse, descriptionResponse] = await Promise.all([
			fetch(`${proxy}/items/${req.params.id}`),
			fetch(`${proxy}/items/${req.params.id}/descriptions`)
		])

		const productData = await productResponse.json()
		const descriptionData = await descriptionResponse.json()

		const categoriesResponse = await fetch(
			`${proxy}/categories/${productData.category_id}`
		)
		const categoriesData = await categoriesResponse.json()

		const item = formatItem(productData, descriptionData, categoriesData)
		res.json(item)
	} catch {
		res
			.status(404)
			.send('No se pudo obtener correctamente los datos de Mercado Libre')
	}
})

app.listen(port, () => {
	console.log('Meli server is listening on port ' + port)
})
