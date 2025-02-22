const axios = require('axios');
const ethers = require('ethers');
const fs = require('fs');
const readline = require('readline');
const colors = require('colors');

console.clear();

const banner = `

    █▀▀ ▀█ █▄░█ █▀█ █ █░█ ▄▀█ █░░ 
    █▀░ █▄ █░▀█ █▀▄ █ ▀▄▀ █▀█ █▄▄ 

        Running Gamerboom Autoreff

`.cyan;

console.log(banner);

const proxies = fs.readFileSync('proxies.txt', 'utf-8').split('\n').filter(Boolean);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function generateRandomPrivateKey() {
    return ethers.Wallet.createRandom().privateKey;
}

async function connectWallet(privateKey) {
    const wallet = new ethers.Wallet(privateKey);
    const message = 'Welcome to GamerBoom!';
    const signature = await wallet.signMessage(message);
    await delay(3000); 
    return { wallet, signature };
}

async function loginOrRegister(walletAddress, signature, referralLink) {
    try {
        const response = await axios.post('https://app.gamerboom.org/api/assets/wallet/login_or_register/', {
            chainId: 1,
            address: walletAddress,
            gbInviteCode: referralLink.split('/i/')[1]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${signature}` 
            }
        });
        await delay(5000);
        return response.data.token;
    } catch (error) {
        console.error('✖ Error saat login/register:'.red, error.response ? error.response.data : error.message);
        throw error;
    }
}

async function getAllTasks(token) {
    try {
        const response = await axios.get('https://app.gamerboom.org/api/social/social-reward-rules/?seasonId=7&size=15', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        await delay(3000);
        return response.data.results;
    } catch (error) {
        console.error('✖ Error saat mengambil task:'.red, error.response ? error.response.data : error.message);
        throw error;
    }
}

async function runAccount(privateKey, proxy, referralLink) {
    try {
        console.log(`➤ Menjalankan akun dengan proxy: ${proxy}`.cyan);
        console.log(`➤ Memulai proses untuk akun dengan proxy: ${proxy}`.cyan);

        const { wallet, signature } = await connectWallet(privateKey);
        console.log(`✔  Wallet terhubung: ${wallet.address}`.green);

        const token = await loginOrRegister(wallet.address, signature, referralLink);
        console.log(`✔  Login/Register sukses untuk ${wallet.address}`.green);
        console.log(`   Token: ${token}`.dim);

        const tasks = await getAllTasks(token);
        console.log(`✔  Ditemukan ${tasks.length} task untuk ${wallet.address}`.green);

        console.log(`✔  Proses selesai untuk ${wallet.address}`.green);
        console.log(`➤ Selesai menjalankan akun, menunggu sebelum lanjut ke akun berikutnya...`.yellow);
    } catch (error) {
        console.error(`✖ Error untuk ${privateKey}:`.red, error.response ? error.response.data : error.message);
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('➤ Masukkan link referral: ', async (referralLink) => {
    rl.close();

    const privateKeys = proxies.map(() => generateRandomPrivateKey());

    for (let i = 0; i < privateKeys.length; i++) {
        console.log(`============================================================`.yellow);
        await runAccount(privateKeys[i], proxies[i], referralLink);
        await delay(10000); 
    }

    console.log('✔ Semua akun telah diproses!'.green);
});