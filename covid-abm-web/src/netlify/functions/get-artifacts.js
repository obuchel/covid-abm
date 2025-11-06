// netlify/functions/get-artifacts.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
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

  // Get run ID from query parameters
  const runId = event.queryStringParameters?.run_id;

  if (!runId) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'run_id parameter is required' })
    };
  }

  try {
    // Get artifacts for the specific run
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${runId}/artifacts`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`
        }
      }
    );

    const data = await response.json();

    if (response.ok) {
      // Format artifacts
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
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artifacts })
      };
    } else {
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: data.message || 'Failed to fetch artifacts' 
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
