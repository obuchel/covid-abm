// netlify/functions/get-artifacts.js
const fetch = require('node-fetch');

// netlify/functions/get-artifacts.js

exports.handler = async (event, context) => {
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
  const runId = event.queryStringParameters?.run_id;

  if (!runId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'run_id parameter is required' })
    };
  }

  if (!GITHUB_TOKEN) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'GitHub token not configured' })
    };
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}/artifacts`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'Netlify-Function'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: errorText })
      };
    }

    const data = await response.json();
    
    const artifacts = data.artifacts.map(artifact => ({
      id: artifact.id,
      name: artifact.name,
      size_in_bytes: artifact.size_in_bytes,
      created_at: artifact.created_at,
      expired: artifact.expired,
      download_url: artifact.archive_download_url
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ artifacts })
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
