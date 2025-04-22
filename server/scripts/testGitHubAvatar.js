/**
 * Script to test GitHub avatar downloads for specific usernames
 * Usage: node scripts/testGitHubAvatar.js <username1> <username2> ...
 * 
 * Example: node scripts/testGitHubAvatar.js TheAwiteb octocat
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const avatarService = require('../services/avatarService');
const Logger = require('../utils/Logger');

// Create a logger for this script
const logger = Logger.createComponentLogger('TestAvatarScript');

// Directory to save test avatars
const testDir = path.join(__dirname, '../../avatars/test');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

/**
 * Test GitHub avatar URL for a username using the direct URL format
 * @param {string} username - GitHub username to test
 */
async function testGitHubAvatar(username) {
  logger.info(`Testing GitHub avatar URL for username: "${username}"`);
  
  // Direct GitHub avatar URL - the most reliable format
  const avatarUrl = `https://github.com/${username}.png`;
  
  try {
    logger.info(`Trying URL: ${avatarUrl}`);
    
    const response = await axios({
      method: 'get',
      url: avatarUrl,
      responseType: 'stream',
      timeout: 10000,
      validateStatus: status => status === 200
    });
    
    // Success! Save the avatar to test directory
    const outputPath = path.join(testDir, `${username}.png`);
    const writer = fs.createWriteStream(outputPath);
    
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    logger.success(`✅ SUCCESS for ${avatarUrl} - saved to ${outputPath}`);
    return { username, success: true };
  } catch (error) {
    if (error.response && error.response.status) {
      logger.error(`❌ FAILED for ${avatarUrl} - HTTP ${error.response.status}`);
    } else {
      logger.error(`❌ FAILED for ${avatarUrl} - ${error.message}`);
    }
    return { username, success: false, error: error.message };
  }
}

/**
 * Main function to test multiple usernames
 */
async function main() {
  const usernames = process.argv.slice(2);
  
  if (usernames.length === 0) {
    logger.info('No usernames provided. Using default test usernames.');
    usernames.push('TheAwiteb', 'octocat');
  }
  
  logger.info(`Testing ${usernames.length} GitHub usernames for avatar availability`);
  
  const results = [];
  
  for (const username of usernames) {
    try {
      const result = await testGitHubAvatar(username);
      results.push(result);
    } catch (error) {
      logger.error(`Error testing "${username}": ${error.message}`);
      results.push({ username, success: false, error: error.message });
    }
  }
  
  // Summary
  logger.info('\n--- SUMMARY ---');
  for (const result of results) {
    if (result.success) {
      logger.success(`✅ "${result.username}": Avatar found`);
    } else {
      logger.error(`❌ "${result.username}": No avatar found ${result.error ? `(${result.error})` : ''}`);
    }
  }
}

// Run the script
main()
  .then(() => {
    logger.info('Testing completed. Check the avatars/test directory for results.');
    process.exit(0);
  })
  .catch(error => {
    logger.error(`Script failed: ${error.message}`);
    process.exit(1);
  }); 