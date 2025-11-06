// netlify/functions/get-workflow-runs.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Allow GET and OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

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
    // Get workflow runs
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/single-simulation.yml/runs?per_page=10`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`
        }
      }
    );

    const data = await response.json();

    if (response.ok) {
      // Format the runs for easier consumption
      const runs = data.workflow_runs.map(run => ({
        id: run.id,
        status: run.status,
        conclusion: run.conclusion,
        created_at: run.created_at,
        updated_at: run.updated_at,
        html_url: run.html_url,
        run_number: run.run_number
      }));

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ runs })
      };
    } else {
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: data.message || 'Failed to fetch workflow runs' 
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
