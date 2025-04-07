"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGourceAvatarMapping = exports.getAllAvatars = exports.saveAvatar = exports.updateAvatarLastUsed = exports.getAvatarByUsername = exports.downloadAvatarsForRepo = exports.extractUsernamesFromRepo = exports.fetchGithubAvatar = exports.generateAvatarId = void 0;
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const util_1 = __importDefault(require("util"));
const database_1 = __importDefault(require("../models/database"));
// Répertoire pour stocker les avatars
const AVATAR_BASE_DIR = path_1.default.join(__dirname, '../../../data/avatars');
// S'assurer que le répertoire existe
if (!fs_1.default.existsSync(AVATAR_BASE_DIR)) {
    fs_1.default.mkdirSync(AVATAR_BASE_DIR, { recursive: true });
}
/**
 * Generate a unique ID for an avatar based on the username
 */
const generateAvatarId = (username) => {
    return crypto_1.default.createHash('md5').update(username.toLowerCase()).digest('hex');
};
exports.generateAvatarId = generateAvatarId;
/**
 * Fetch avatar for a GitHub username
 */
const fetchGithubAvatar = (username) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`Fetching avatar for GitHub user: ${username}`);
        // Check if we already have this avatar
        const existingAvatar = yield (0, exports.getAvatarByUsername)(username);
        if (existingAvatar) {
            console.log(`Avatar already exists for ${username}`);
            // Update last used timestamp
            yield (0, exports.updateAvatarLastUsed)(existingAvatar.id);
            return existingAvatar.image_path;
        }
        // Try to fetch from GitHub API
        const response = yield axios_1.default.get(`https://api.github.com/users/${username}`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Gource-Tools'
            }
        });
        if (response.data && response.data.avatar_url) {
            // Download the avatar image
            const avatarUrl = response.data.avatar_url;
            const avatarId = (0, exports.generateAvatarId)(username);
            const avatarPath = path_1.default.join(AVATAR_BASE_DIR, `${avatarId}.png`);
            const imageResponse = yield axios_1.default.get(avatarUrl, { responseType: 'arraybuffer' });
            fs_1.default.writeFileSync(avatarPath, Buffer.from(imageResponse.data, 'binary'));
            // Save to database
            yield (0, exports.saveAvatar)({
                id: avatarId,
                username,
                email: response.data.email || '',
                image_path: avatarPath,
                provider: 'github'
            });
            console.log(`Successfully downloaded avatar for ${username}`);
            return avatarPath;
        }
        return null;
    }
    catch (error) {
        console.error(`Error fetching GitHub avatar for ${username}:`, error);
        return null;
    }
});
exports.fetchGithubAvatar = fetchGithubAvatar;
/**
 * Extract usernames from git log
 */
const extractUsernamesFromRepo = (repoPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { exec } = require('child_process');
        const execAsync = util_1.default.promisify(exec);
        const { stdout } = yield execAsync('git log --format="%an" | sort -u', { cwd: repoPath });
        const usernames = stdout.split('\n').filter(Boolean);
        console.log(`Extracted ${usernames.length} unique usernames from repository`);
        return usernames;
    }
    catch (error) {
        console.error('Error extracting usernames from repository:', error);
        return [];
    }
});
exports.extractUsernamesFromRepo = extractUsernamesFromRepo;
/**
 * Download avatars for all users in a repository
 */
const downloadAvatarsForRepo = (repoPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const usernames = yield (0, exports.extractUsernamesFromRepo)(repoPath);
        let success = 0;
        let failed = 0;
        for (const username of usernames) {
            try {
                const result = yield (0, exports.fetchGithubAvatar)(username);
                if (result) {
                    success++;
                }
                else {
                    failed++;
                }
            }
            catch (error) {
                console.error(`Error downloading avatar for ${username}:`, error);
                failed++;
            }
        }
        return {
            total: usernames.length,
            success,
            failed
        };
    }
    catch (error) {
        console.error('Error downloading avatars for repository:', error);
        return { total: 0, success: 0, failed: 0 };
    }
});
exports.downloadAvatarsForRepo = downloadAvatarsForRepo;
/**
 * Get avatar by username
 */
const getAvatarByUsername = (username) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        database_1.default.get('SELECT * FROM avatars WHERE username = ?', [username], (err, row) => {
            if (err || !row) {
                resolve(null);
            }
            else {
                resolve(row);
            }
        });
    });
});
exports.getAvatarByUsername = getAvatarByUsername;
/**
 * Update avatar last used timestamp
 */
const updateAvatarLastUsed = (avatarId) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const now = new Date().toISOString();
        database_1.default.run('UPDATE avatars SET last_used = ? WHERE id = ?', [now, avatarId], (err) => {
            if (err) {
                console.error('Error updating avatar last used:', err);
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
});
exports.updateAvatarLastUsed = updateAvatarLastUsed;
/**
 * Save avatar to database
 */
const saveAvatar = (avatar) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const now = new Date().toISOString();
        database_1.default.run('INSERT OR REPLACE INTO avatars (id, username, email, image_path, provider, created_at, last_used) VALUES (?, ?, ?, ?, ?, ?, ?)', [avatar.id, avatar.username, avatar.email || '', avatar.image_path, avatar.provider, now, now], (err) => {
            if (err) {
                console.error('Error saving avatar:', err);
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
});
exports.saveAvatar = saveAvatar;
/**
 * Get all avatars
 */
const getAllAvatars = () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        database_1.default.all('SELECT * FROM avatars ORDER BY last_used DESC', [], (err, rows) => {
            if (err) {
                console.error('Error getting all avatars:', err);
                reject(err);
            }
            else {
                resolve(rows || []);
            }
        });
    });
});
exports.getAllAvatars = getAllAvatars;
/**
 * Create avatar mapping file for Gource
 * Format: <username>=<avatar_path>
 */
const createGourceAvatarMapping = (outputPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const avatars = yield (0, exports.getAllAvatars)();
        if (!avatars.length) {
            return '';
        }
        const mappingContent = avatars
            .map(avatar => `${avatar.username}=${avatar.image_path}`)
            .join('\n');
        fs_1.default.writeFileSync(outputPath, mappingContent);
        console.log(`Created Gource avatar mapping at ${outputPath}`);
        return outputPath;
    }
    catch (error) {
        console.error('Error creating Gource avatar mapping:', error);
        throw error;
    }
});
exports.createGourceAvatarMapping = createGourceAvatarMapping;
