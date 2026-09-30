// utils/filters.js
// Function to build MongoDB query from request query parameters

function buildListingQuery(queryParams) {
    const query = {};

    // Price filters
    if (queryParams.price_min && queryParams.price_min.trim() !== '') {
        const min = parseInt(queryParams.price_min);
        if (!isNaN(min)) {
            query.price = query.price || {};
            query.price.$gte = min;
        }
    }
    if (queryParams.price_max && queryParams.price_max.trim() !== '') {
        const max = parseInt(queryParams.price_max);
        if (!isNaN(max)) {
            query.price = query.price || {};
            query.price.$lte = max;
        }
    }

    // Category filter (if provided)
    if (queryParams.category) {
        if (Array.isArray(queryParams.category)) {
            // Filter out empty strings
            const categories = queryParams.category.filter(cat => cat && cat.trim() !== '');
            if (categories.length > 0) {
                query.category = { $in: categories };
            }
        } else if (queryParams.category && queryParams.category.trim() !== '') {
            query.category = queryParams.category;
        }
    }

    // Location filter
    if (queryParams.location && queryParams.location.trim() !== '') {
        query.location = { $regex: queryParams.location.trim(), $options: 'i' };
    }

    // Country filter
    if (queryParams.country && queryParams.country.trim() !== '') {
        query.country = { $regex: queryParams.country.trim(), $options: 'i' };
    }

    return query;
}

module.exports = { buildListingQuery };