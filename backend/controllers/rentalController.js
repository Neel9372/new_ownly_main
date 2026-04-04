const db = require("../db");

// Admin distributes rental income for a property
exports.distributeRental = async (req, res) => {
    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const { property_id, total_rental_amount, month, year } = req.body;

        if (!property_id || !total_rental_amount || !month || !year) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // 1. Check property exists
        const propertyCheck = await client.query(
            `SELECT p.*, pf.total_tokens
       FROM properties p
       JOIN property_funding pf ON p.id = pf.property_id
       WHERE p.id = $1`,
            [property_id]
        );

        if (propertyCheck.rows.length === 0) {
            return res.status(404).json({ error: "Property not found" });
        }

        // 2. Check rental not already distributed for this month/year
        const duplicateCheck = await client.query(
            `SELECT id FROM rental_distributions 
       WHERE property_id = $1 AND month = $2 AND year = $3`,
            [property_id, month, year]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(400).json({
                error: `Rental already distributed for ${month} ${year}`
            });
        }

        const total_tokens = propertyCheck.rows[0].total_tokens;

        // 3. Get all investors for this property
        const investors = await client.query(
            `SELECT i.user_id, i.tokens_owned,
              ROUND((i.tokens_owned::NUMERIC / $1) * 100, 4) as ownership_percentage,
              ROUND((i.tokens_owned::NUMERIC / $1) * $2, 2) as rental_share
       FROM investments i
       WHERE i.property_id = $3`,
            [total_tokens, total_rental_amount, property_id]
        );

        if (investors.rows.length === 0) {
            return res.status(400).json({ error: "No investors found for this property" });
        }

        // 4. Record rental distribution
        await client.query(
            `INSERT INTO rental_distributions 
        (property_id, total_rental_amount, month, year)
       VALUES ($1, $2, $3, $4)`,
            [property_id, total_rental_amount, month, year]
        );

        // 5. Record individual payout for each investor
        let distributionSummary = [];

        for (const investor of investors.rows) {
            await client.query(
                `INSERT INTO transactions 
          (user_id, property_id, amount, type, status)
         VALUES ($1, $2, $3, 'RENTAL', 'SUCCESS')`,
                [investor.user_id, property_id, investor.rental_share]
            );

            distributionSummary.push({
                user_id: investor.user_id,
                tokens_owned: investor.tokens_owned,
                ownership_percentage: investor.ownership_percentage,
                rental_share: investor.rental_share,
            });
        }

        // 6. Update property leasing totals
        await client.query(
            `UPDATE property_leasing
       SET total_rent_distributed = total_rent_distributed + $1
       WHERE property_id = $2`,
            [total_rental_amount, property_id]
        );

        await client.query("COMMIT");

        res.json({
            message: `Rental distributed successfully for ${month} ${year}`,
            property_id,
            total_rental_amount,
            total_investors: investors.rows.length,
            distribution_summary: distributionSummary,
        });

    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        res.status(500).json({ error: "Rental distribution failed" });
    } finally {
        client.release();
    }
};

// Get rental distribution history for a property
exports.getRentalHistory = async (req, res) => {
    try {
        const { property_id } = req.params;

        const result = await db.query(
            `SELECT rd.*, p.title
       FROM rental_distributions rd
       JOIN properties p ON rd.property_id = p.id
       WHERE rd.property_id = $1
       ORDER BY rd.year DESC, rd.distributed_at DESC`,
            [property_id]
        );

        res.json({ rental_history: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch rental history" });
    }
};

// Investor sees their total rental income
exports.getMyRentalIncome = async (req, res) => {
    try {
        const user_id = req.user.id;

        const result = await db.query(
            `SELECT 
        t.id,
        t.amount as rental_received,
        t.created_at,
        p.title as property_title,
        p.location,
        rd.month,
        rd.year
       FROM transactions t
       JOIN properties p ON t.property_id = p.id
       LEFT JOIN rental_distributions rd 
         ON rd.property_id = t.property_id
         AND DATE_TRUNC('day', rd.distributed_at) = DATE_TRUNC('day', t.created_at)
       WHERE t.user_id = $1 AND t.type = 'RENTAL'
       ORDER BY t.created_at DESC`,
            [user_id]
        );

        const totalRentalIncome = result.rows.reduce(
            (sum, r) => sum + parseFloat(r.rental_received), 0
        );

        res.json({
            rental_income: result.rows,
            total_rental_received: totalRentalIncome,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch rental income" });
    }
};