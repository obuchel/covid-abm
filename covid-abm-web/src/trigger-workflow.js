// netlify/functions/trigger-workflow.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get GitHub credentials from environment variables
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = process.env.REPO_OWNER;
  const REPO_NAME = process.env.REPO_NAME;

  if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  try {
    // Parse the request body
    const params = JSON.parse(event.body);
    
    // Trigger the workflow
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/single-simulation.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
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

    if (response.ok) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ 
          success: true,
          message: 'Workflow triggered successfully' 
        })
      };
    } else {
      const errorData = await response.json();
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: errorData.message || 'Failed to trigger workflow' 
        })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: error.message 
      })
    };
  }
};
