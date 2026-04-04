const db = require("../db");

// Investor buys tokens
exports.investInProperty = async (req, res) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const user_id = req.user.id;
    const { property_id, tokens_to_buy, transaction_hash } = req.body;

    // 1. Check user KYC is verified
    const userCheck = await client.query(
      `SELECT kyc_status, wallet_status FROM users WHERE id = $1`,
      [user_id]
    );

    if (userCheck.rows[0].kyc_status !== "VERIFIED") {
      return res.status(403).json({ 
        error: "Your KYC must be verified before investing" 
      });
    }

    if (userCheck.rows[0].wallet_status !== "CONNECTED") {
      return res.status(403).json({ 
        error: "Please connect your wallet before investing" 
      });
    }

    // 2. Get property funding details
    const fundingCheck = await client.query(
      `SELECT pf.*, p.status, p.title
       FROM property_funding pf
       JOIN properties p ON pf.property_id = p.id
       WHERE pf.property_id = $1`,
      [property_id]
    );

    if (fundingCheck.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    const funding = fundingCheck.rows[0];

    // 3. Check property is available
    if (funding.status !== "AVAILABLE") {
      return res.status(400).json({ 
        error: `Property is not available for investment. Status: ${funding.status}` 
      });
    }

    // 4. Check enough tokens remaining
    if (tokens_to_buy > funding.total_tokens_remaining) {
      return res.status(400).json({ 
        error: `Not enough tokens available. Only ${funding.total_tokens_remaining} tokens remaining` 
      });
    }

    // 5. Calculate investment amount
    const invested_amount = tokens_to_buy * funding.token_price;

    // 6. Check if user already invested in this property
    const existingInvestment = await client.query(
      `SELECT id, tokens_owned FROM investments 
       WHERE user_id = $1 AND property_id = $2`,
      [user_id, property_id]
    );

    if (existingInvestment.rows.length > 0) {
      // Update existing investment
      await client.query(
        `UPDATE investments 
         SET tokens_owned = tokens_owned + $1,
             invested_amount = invested_amount + $2,
             transaction_hash = $3
         WHERE user_id = $4 AND property_id = $5`,
        [tokens_to_buy, invested_amount, transaction_hash, user_id, property_id]
      );
    } else {
      // Create new investment
      await client.query(
        `INSERT INTO investments 
          (user_id, property_id, tokens_owned, invested_amount, transaction_hash)
         VALUES ($1, $2, $3, $4, $5)`,
        [user_id, property_id, tokens_to_buy, invested_amount, transaction_hash]
      );
    }

    // 7. Update property funding stats
    const newFundedAmount = parseFloat(funding.funded_amount) + invested_amount;
    const newTokensSold = parseFloat(funding.total_tokens_sold) + tokens_to_buy;
    const newTokensRemaining = parseFloat(funding.total_tokens_remaining) - tokens_to_buy;
    const newFundingPercentage = (newTokensSold / funding.total_tokens) * 100;
    
    await client.query(
      `UPDATE property_funding
       SET funded_amount = $1,
           total_tokens_sold = $2,
           total_tokens_remaining = $3,
           funding_percentage = $4,
           investor_count = (
             SELECT COUNT(DISTINCT user_id) 
             FROM investments 
             WHERE property_id = $5
           )
       WHERE property_id = $5`,
      [newFundedAmount, newTokensSold, newTokensRemaining, newFundingPercentage, property_id]
    );

    // 8. If fully funded update property status
    if (newTokensRemaining <= 0) {
      await client.query(
        `UPDATE properties SET status = 'FUNDED' WHERE id = $1`,
        [property_id]
      );
    }

    // 9. Record transaction
    await client.query(
      `INSERT INTO transactions 
        (user_id, property_id, amount, type, transaction_hash, status)
       VALUES ($1, $2, $3, 'INVEST', $4, 'SUCCESS')`,
      [user_id, property_id, invested_amount, transaction_hash]
    );

    await client.query("COMMIT");

    res.json({
      message: "Investment successful!",
      investment: {
        property_id,
        tokens_bought: tokens_to_buy,
        amount_invested: invested_amount,
        token_price: funding.token_price,
        ownership_percentage: ((tokens_to_buy / funding.total_tokens) * 100).toFixed(4),
        transaction_hash,
      }
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Investment failed" });
  } finally {
    client.release();
  }
};

// Get investor portfolio
exports.getMyPortfolio = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await db.query(
      `SELECT 
        i.id,
        i.tokens_owned,
        i.invested_amount,
        i.transaction_hash,
        i.created_at,
        p.title,
        p.location,
        p.property_type,
        p.status as property_status,
        pf.token_price,
        pf.total_tokens,
        pf.funding_percentage,
        pfi.gross_yield,
        pfi.net_yield,
        pfi.predicted_roi,
        pm.image_url,
        ROUND((i.tokens_owned::NUMERIC / pf.total_tokens) * 100, 4) as ownership_percentage,
        ROUND(i.tokens_owned * pfi.net_yield / 100 * pf.token_price, 2) as estimated_annual_return
       FROM investments i
       JOIN properties p ON i.property_id = p.id
       LEFT JOIN property_funding pf ON p.id = pf.property_id
       LEFT JOIN property_financials pfi ON p.id = pfi.property_id
       LEFT JOIN property_media pm ON p.id = pm.property_id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC`,
      [user_id]
    );

    // Calculate totals
    const totalInvested = result.rows.reduce(
      (sum, inv) => sum + parseFloat(inv.invested_amount), 0
    );
    const totalTokens = result.rows.reduce(
      (sum, inv) => sum + parseInt(inv.tokens_owned), 0
    );

    res.json({
      portfolio: result.rows,
      summary: {
        total_invested: totalInvested,
        total_tokens_owned: totalTokens,
        total_properties: result.rows.length,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
};

// Get my transactions
exports.getMyTransactions = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await db.query(
      `SELECT 
        t.*,
        p.title as property_title,
        p.location
       FROM transactions t
       LEFT JOIN properties p ON t.property_id = p.id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [user_id]
    );

    res.json({ transactions: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// Get single property investments (admin view)
exports.getPropertyInvestments = async (req, res) => {
  try {
    const { property_id } = req.params;

    const result = await db.query(
      `SELECT 
        i.*,
        u.fname, u.lname, u.email,
        u.wallet_address,
        ROUND((i.tokens_owned::NUMERIC / pf.total_tokens) * 100, 4) as ownership_percentage
       FROM investments i
       JOIN users u ON i.user_id = u.id
       JOIN property_funding pf ON i.property_id = pf.property_id
       WHERE i.property_id = $1
       ORDER BY i.tokens_owned DESC`,
      [property_id]
    );

    res.json({ investments: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch investments" });
  }
};