import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    // General Settings
    appName: { type: String, default: 'Bus Tracker' },
    defaultLanguage: { type: String, default: 'en-US' },
    timezone: { type: String, default: 'UTC' },

    // Notification Settings
    emailEnabled: { type: Boolean, default: false },
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    // NOTE: Storing SMTP password directly is not ideal. Consider env variables or secure vault.
    smtpPassEncrypted: { type: String, default: '' }, // Store encrypted/hashed

    // Security Settings
    mfaRequired: { type: Boolean, default: false },
    passwordMinLength: { type: Number, default: 8 },
    apiRateLimit: { type: Number, default: 100 }, // requests per minute

    // Data Management Settings
    logRetentionDays: { type: Number, default: 30 },
    autoBackupEnabled: { type: Boolean, default: false },
    backupFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },

    // Singleton pattern: Ensures only one settings document exists
    singleton: { type: Boolean, default: true, unique: true }
}, { timestamps: true });

// Method to get settings, creating default if not found
settingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne({ singleton: true });
    if (!settings) {
        console.log("No settings found, creating default settings document.");
        settings = new this(); // Create default settings
        await settings.save();
    }
    return settings;
};

// Encryption is handled in the controller before saving.
// Decryption/comparison is not typically needed for SMTP passwords,
// the application would use the stored credentials directly when connecting.

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings; 