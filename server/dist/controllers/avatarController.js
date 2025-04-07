"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.createAvatarMapping = exports.getAvatarImage = exports.downloadAvatarsForRepo = exports.fetchGithubAvatar = exports.getAvatarByUsername = exports.getAllAvatars = void 0;
const avatarService = __importStar(require("../services/avatarService"));
const path_1 = __importDefault(require("path"));
// Get all avatars
const getAllAvatars = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const avatars = yield avatarService.getAllAvatars();
        // Format avatar response for client
        const formattedAvatars = avatars.map(avatar => ({
            id: avatar.id,
            username: avatar.username,
            email: avatar.email,
            imagePath: avatar.image_path,
            provider: avatar.provider,
            createdAt: avatar.created_at,
            lastUsed: avatar.last_used
        }));
        return res.status(200).json(formattedAvatars);
    }
    catch (error) {
        console.error('Error retrieving avatars:', error);
        return res.status(500).json({ error: 'Error retrieving avatars' });
    }
});
exports.getAllAvatars = getAllAvatars;
// Get avatar by username
const getAvatarByUsername = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.params;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        const avatar = yield avatarService.getAvatarByUsername(username);
        if (!avatar) {
            return res.status(404).json({ error: 'Avatar not found' });
        }
        // Format avatar response for client
        const formattedAvatar = {
            id: avatar.id,
            username: avatar.username,
            email: avatar.email,
            imagePath: avatar.image_path,
            provider: avatar.provider,
            createdAt: avatar.created_at,
            lastUsed: avatar.last_used
        };
        return res.status(200).json(formattedAvatar);
    }
    catch (error) {
        console.error('Error retrieving avatar:', error);
        return res.status(500).json({ error: 'Error retrieving avatar' });
    }
});
exports.getAvatarByUsername = getAvatarByUsername;
// Download avatar for a GitHub username
const fetchGithubAvatar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        const avatarPath = yield avatarService.fetchGithubAvatar(username);
        if (!avatarPath) {
            return res.status(404).json({ error: 'Could not fetch avatar for this username' });
        }
        const avatar = yield avatarService.getAvatarByUsername(username);
        // Format avatar response for client
        const formattedAvatar = {
            id: avatar.id,
            username: avatar.username,
            email: avatar.email,
            imagePath: avatar.image_path,
            provider: avatar.provider,
            createdAt: avatar.created_at,
            lastUsed: avatar.last_used
        };
        return res.status(200).json({
            success: true,
            message: 'Avatar fetched successfully',
            avatar: formattedAvatar
        });
    }
    catch (error) {
        console.error('Error fetching avatar:', error);
        return res.status(500).json({ error: 'Error fetching avatar' });
    }
});
exports.fetchGithubAvatar = fetchGithubAvatar;
// Download avatars for repository
const downloadAvatarsForRepo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { repoPath } = req.body;
        if (!repoPath) {
            return res.status(400).json({ error: 'Repository path is required' });
        }
        const result = yield avatarService.downloadAvatarsForRepo(repoPath);
        return res.status(200).json({
            success: true,
            message: `Downloaded ${result.success} avatars from ${result.total} users`,
            result
        });
    }
    catch (error) {
        console.error('Error downloading avatars:', error);
        return res.status(500).json({ error: 'Error downloading avatars' });
    }
});
exports.downloadAvatarsForRepo = downloadAvatarsForRepo;
// Get avatar image by ID
const getAvatarImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'Avatar ID is required' });
        }
        const avatars = yield avatarService.getAllAvatars();
        const avatar = avatars.find(a => a.id === id);
        if (!avatar) {
            return res.status(404).json({ error: 'Avatar not found' });
        }
        // Serve the image file
        return res.sendFile(avatar.image_path);
    }
    catch (error) {
        console.error('Error retrieving avatar image:', error);
        return res.status(500).json({ error: 'Error retrieving avatar image' });
    }
});
exports.getAvatarImage = getAvatarImage;
// Create Gource avatar mapping
const createAvatarMapping = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dataDir = path_1.default.join(__dirname, '../../../data');
        const mappingPath = path_1.default.join(dataDir, 'avatar-mapping.txt');
        const result = yield avatarService.createGourceAvatarMapping(mappingPath);
        if (!result) {
            return res.status(404).json({ error: 'No avatars found to create mapping' });
        }
        return res.status(200).json({
            success: true,
            message: 'Avatar mapping created successfully',
            mappingPath: result
        });
    }
    catch (error) {
        console.error('Error creating avatar mapping:', error);
        return res.status(500).json({ error: 'Error creating avatar mapping' });
    }
});
exports.createAvatarMapping = createAvatarMapping;
