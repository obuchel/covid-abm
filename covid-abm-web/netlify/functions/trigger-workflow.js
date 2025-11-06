// netlify/functions/trigger-workflow.js
const fetch = require('node-fetch');

// netlify/functions/trigger-workflow.js

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = process.env.REPO_OWNER || 'obuchel';
  const REPO_NAME = process.env.REPO_NAME || 'covid-abm';

  if (!GITHUB_TOKEN) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'GitHub token not configured' })
    };
  }

  try {
    const params = JSON.parse(event.body);
    console.log('Triggering workflow with:', params);
    
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/single-simulation.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Netlify-Function'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            num_agents: params.num_agents.toString(),
            simulation_days: params.simulation_days.toString(),
            spread_chance: params.spread_chance.toString(),
            precaution_rate: params.precaution_rate.toString(),
            vaccination_rate: params.vaccination_rate.toString(),
            num_replications: params.num_replications.toString()
          }
        })
      }
    );

    console.log('GitHub response:', response.status);

    if (response.ok) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true,
          message: 'Workflow triggered successfully' 
        })
      };
    } else {
      const errorData = await response.json();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: errorData.message })
      };
    }
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};