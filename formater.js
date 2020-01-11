const author = {
	name: 'Francisco',
	lastname: 'Rodriguez'
}

const formatPrice = (currency, price) => {
	if (/\./.test(String(price))) {
		return {
			currency,
			amount: Number(String(price).split('.')[0]),
			decimals: Number(String(price).split('.')[1])
		}
	} else {
		return {
			currency,
			amount: price,
			decimals: 0
		}
	}
}

const formatPicture = url => url.replace('http', 'https')

const formatItems = ({ available_filters, filters, results }) => {
	const categories = () => {
		let categoriesFromAvailableFilters = available_filters.filter(
			filter => filter.id === 'category'
		)
		let categoriesFromFilters = filters.filter(
			filter => filter.id === 'category'
		)
		if (categoriesFromAvailableFilters.length > 0) {
			return categoriesFromAvailableFilters[0].values.map(({ name }) => name)
		} else if (categoriesFromFilters.length > 0) {
			return categoriesFromFilters[0].values.map(({ name }) => name)
		}
	}

	const items = results.map(result => ({
		id: result.id,
		title: result.title,
		price: formatPrice(result.currency_id, result.price),
		picture: formatPicture(result.thumbnail),
		condition: result.condition,
		free_shipping: result.shipping.free_shipping,
		city: result.address.state_name
	}))

	return { author, categories: categories(), items }
}

const formatItem = (product, description, categories) => {
	const paths = categories.path_from_root.map(path => path.name)

	const item = {
		id: product.id,
		title: product.title,
		price: formatPrice(product.currency_id, product.price),
		picture: formatPicture(product.pictures[0].url),
		condition: product.condition,
		free_shipping: product.shipping.free_shipping,
		sold_quantity: product.sold_quantity,
		description: description[0].plain_text,
		categories: paths
	}

	return { author, item }
}

module.exports = { formatItems, formatItem }
