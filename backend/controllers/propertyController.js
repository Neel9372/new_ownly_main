const db = require("../db");
const { createPropertyOnChain } = require("../service/blockchainService");

// Add new property (Admin only)
exports.addProperty = async (req, res) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const {
      // Core
      title, property_type, status, size_sqft,
      location, developer, building_age, total_floors, amenities,
      // Financials
      property_price, transaction_costs, total_investment_cost,
      price_per_sqft, gross_yield, net_yield, annual_appreciation,
      // Funding
      total_tokens, token_price, funding_closing_date, current_valuation,
      // Leasing
      leasing_strategy, occupancy_rate, projected_annual_rent, rental_payment_schedule,
      // Media
      image_url, document_url, investment_tag
    } = req.body;

    // 1. Insert core property
    const propertyResult = await client.query(
      `INSERT INTO properties 
        (title, property_type, status, size_sqft, location, developer, building_age, total_floors, amenities)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [title, property_type || 'Residential', status || 'AVAILABLE', size_sqft || null, location || null, developer || null, building_age || null, total_floors || null, amenities || null]
    );

    const property_id = propertyResult.rows[0].id;

    // 2. Insert financials
    await client.query(
      `INSERT INTO property_financials
        (property_id, property_price, transaction_costs, total_investment_cost, price_per_sqft, gross_yield, net_yield, annual_appreciation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [property_id, property_price || null, transaction_costs || null, total_investment_cost || null, price_per_sqft || null, gross_yield || null, net_yield || null, annual_appreciation || null]
    );

    // 3. Insert funding
    await client.query(
      `INSERT INTO property_funding
        (property_id, total_tokens, token_price, funding_closing_date, current_valuation, total_tokens_remaining)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [property_id, total_tokens || null, token_price || null, funding_closing_date || null, current_valuation || null, total_tokens || null]
    );

    // 4. Insert leasing
    await client.query(
      `INSERT INTO property_leasing
        (property_id, leasing_strategy, occupancy_rate, projected_annual_rent, rental_payment_schedule)
       VALUES ($1,$2,$3,$4,$5)`,
      [property_id, leasing_strategy || null, occupancy_rate || null, projected_annual_rent || null, rental_payment_schedule || null]
    );

    // 5. Insert media
    await client.query(
      `INSERT INTO property_media
        (property_id, image_url, document_url, investment_tag)
       VALUES ($1,$2,$3,$4)`,
      [property_id, image_url || null, document_url || null, investment_tag || null]
    );

    await client.query("COMMIT");

    // 6. Create property on blockchain (non-blocking — DB is already saved)
    const tokenSymbol = "OWN" + property_id; // e.g. OWN1, OWN2
    const chainResult = await createPropertyOnChain(
      title,
      location || "India",
      property_id,
      total_investment_cost || property_price,
      total_tokens,
      tokenSymbol
    );

    res.json({
      message: "Property added successfully",
      property_id,
      blockchain: chainResult,
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to add property" });
  } finally {
    client.release();
  }
};

// Get all properties
exports.getAllProperties = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, 
              pf.property_price, pf.gross_yield, pf.net_yield,
              pfund.total_tokens, pfund.token_price, pfund.funding_percentage,
              pm.image_url, pm.investment_tag
       FROM properties p
       LEFT JOIN property_financials pf ON p.id = pf.property_id
       LEFT JOIN property_funding pfund ON p.id = pfund.property_id
       LEFT JOIN property_media pm ON p.id = pm.property_id`
    );

    res.json({ properties: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
};

// Get single property
exports.getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await db.query(`SELECT * FROM properties WHERE id = $1`, [id]);
    const financials = await db.query(`SELECT * FROM property_financials WHERE property_id = $1`, [id]);
    const funding = await db.query(`SELECT * FROM property_funding WHERE property_id = $1`, [id]);
    const leasing = await db.query(`SELECT * FROM property_leasing WHERE property_id = $1`, [id]);
    const media = await db.query(`SELECT * FROM property_media WHERE property_id = $1`, [id]);

    if (property.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.json({
      property: property.rows[0],
      financials: financials.rows[0],
      funding: funding.rows[0],
      leasing: leasing.rows[0],
      media: media.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch property" });
  }
};

// DELETE PROPERTY (Admin)
exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM properties WHERE id = $1`, [id]);
    res.json({ message: "Property deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete property" });
  }
};