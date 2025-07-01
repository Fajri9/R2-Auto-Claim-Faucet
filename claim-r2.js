const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ================== KONFIGURASI ==================
// ✍️ GANTI DENGAN WALLET ADDRESS ANDA
const WALLET_ADDRESS = '0x...';

// --- DATA INTERAKSI (JANGAN DIUBAH JIKA TIDAK PERLU) ---
const GUILD_ID = "1308368864505106442";        // ID Server (Guild)
const CHANNEL_ID = "1339883019556749395";      // ID Channel untuk jaringan "Sepolia"
const APP_ID = "1356609826230243469";          // ID Aplikasi (Bot)
const COMMAND_ID = "1356665931056808211";      // ID Perintah
const COMMAND_VERSION = "1356665931056808212";  // Versi Perintah
// ===============================================

// --- PENGATURAN LAINNYA ---
const MIN_DELAY_MS = 10000; // Delay minimum 10 detik
const MAX_DELAY_MS = 20000; // Delay maksimum 20 detik
// --------------------------

const TOKENS_FILE = path.join(__dirname, 'tokens.txt');
const LOG_FILE = path.join(__dirname, 'log.txt');
const DISCORD_INTERACTIONS_URL = 'https://discord.com/api/v9/interactions';

/**
 * Menulis pesan log ke file log.txt.
 * @param {string} message Pesan untuk di-log.
 */
const logToFile = (message) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`, 'utf8');
};

/**
 * Mengirim permintaan interaksi Slash Command ke Discord API.
 * @param {string} token Token otorisasi Discord.
 */
async function sendClaim(token) {
    const headers = { 'Authorization': token, 'Content-Type': 'application/json' };
    const tokenIdentifier = `...${token.slice(-5)}`;

    const payload = {
        type: 2,
        application_id: APP_ID,
        guild_id: GUILD_ID,
        channel_id: CHANNEL_ID,
        session_id: `c${Date.now()}${(Math.random() * 9999).toFixed()}`,
        data: {
            version: COMMAND_VERSION,
            id: COMMAND_ID,
            name: 'faucet',
            type: 1,
            options: [{ type: 3, name: 'address', value: WALLET_ADDRESS }]
        }
    };

    try {
        const response = await axios.post(DISCORD_INTERACTIONS_URL, payload, { headers });
        // Respon sukses untuk interaksi biasanya 204 (No Content)
        if (response.status === 204) {
            const successMsg = `✅ Permintaan klaim berhasil dikirim untuk token ${tokenIdentifier}`;
            console.log(successMsg);
            logToFile(successMsg);
        } else {
            const warnMsg = `⚠️  Respon tak terduga untuk token ${tokenIdentifier} | Status: ${response.status}`;
            console.warn(warnMsg);
            logToFile(warnMsg);
        }
    } catch (error) {
        let errorMessage = error.message;
        if (error.response) {
            errorMessage = `Status: ${error.response.status} - Data: ${JSON.stringify(error.response.data)}`;
        }
        const failMsg = `❌ Gagal total untuk token ${tokenIdentifier} | ${errorMessage}`;
        console.error(failMsg);
        logToFile(failMsg);
    }
}

/**
 * Fungsi utama untuk menjalankan keseluruhan proses.
 */
async function main() {
    console.log('--- 🚀 Memulai Script Klaim Faucet ---');
    logToFile('--- Script Started ---');

    if (!WALLET_ADDRESS || WALLET_ADDRESS === '0x...') {
        console.error('❌ Harap edit file claim-r2.js dan masukkan WALLET_ADDRESS Anda.');
        return;
    }

    let tokens;
    try {
        tokens = fs.readFileSync(TOKENS_FILE, 'utf8').split('\n').filter(t => t.trim() !== '');
    } catch (error) {
        console.error(`❌ Gagal membaca file ${TOKENS_FILE}. Pastikan file ada dan benar.`);
        logToFile(`FATAL: Gagal membaca file tokens.txt: ${error.message}`);
        return;
    }

    if (tokens.length === 0) {
        console.error('❌ File tokens.txt kosong atau tidak berisi token yang valid.');
        return;
    }

    console.log(`✅ Menemukan ${tokens.length} token. Memulai proses klaim...`);
    logToFile(`Ditemukan ${tokens.length} token. Memulai proses.`);

    for (const [index, token] of tokens.entries()) {
        console.log(`\n[${index + 1}/${tokens.length}] Memproses token berakhiran ...${token.slice(-5)}`);
        await sendClaim(token.trim());

        if (index < tokens.length - 1) {
            const delay = Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
            console.log(`🕒 Menunggu ${delay / 1000} detik sebelum lanjut...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    console.log('\n--- ✅ Semua token telah diproses. Script selesai. ---');
    logToFile('--- Script Finished ---');
}

main();
