const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/properties/add', {
      title: "sminu towers", 
      property_type: "Residential", 
      status: "AVAILABLE",
      location: "borivali", 
      developer: "neel group", 
      size_sqft: 0, 
      building_age: 0, 
      total_floors: 0, 
      amenities: "", 
      rera_id: "",
      property_price: 18500000, 
      transaction_costs: 100000, 
      total_investment_cost: 18600000, 
      price_per_sqft: 0, 
      gross_yield: 9, 
      net_yield: 7, 
      annual_appreciation: 5, 
      total_tokens: 5000, 
      token_price: 2000, 
      funding_closing_date: "2026-10-12", 
      current_valuation: 18500000,
      leasing_strategy: "Long-term", 
      occupancy_rate: 95, 
      projected_annual_rent: 1739000,
      image_url: "", 
      investment_tag: "High Yield"
    }, {
      headers: {
        // Need admin token here.
        // Or I can just check the db directly
      }
    });
    console.log(res.data);
  } catch (err) {
    console.error("API ERROR:", err.response ? err.response.data : err.message);
  }
}
test();
