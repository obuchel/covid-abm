// netlify/functions/get-workflow-runs.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = process.env.REPO_OWNER || 'obuchel';
  const REPO_NAME = process.env.REPO_NAME || 'covid-abm';

  console.log('Env vars:', { 
    hasToken: !!GITHUB_TOKEN, 
    owner: REPO_OWNER, 
    repo: REPO_NAME 
  });

  if (!GITHUB_TOKEN) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'GitHub token not configured' })
    };
  }

  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/single-simulation.yml/runs?per_page=10`;
    console.log('Fetching:', url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'Netlify-Function'
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub error:', errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: errorText })
      };
    }

    const data = await response.json();
    
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
      headers,
      body: JSON.stringify({ runs })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};