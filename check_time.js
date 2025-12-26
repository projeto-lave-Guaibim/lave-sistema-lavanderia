const https = require('https');

console.log('Hora do Computador:', new Date().toString());
console.log('Verificando hora na internet...');

https.get('https://worldtimeapi.org/api/ip', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Hora da Internet (Real):', json.datetime);
            
            const localYear = new Date().getFullYear();
            const remoteYear = new Date(json.datetime).getFullYear();
            
            if (localYear !== remoteYear) {
                console.log('\n❌ ALERTA: O ANO ESTÁ ERRADO!');
                console.log(`Seu computador acha que é ${localYear}, mas na verdade é ${remoteYear}.`);
                console.log('Isso impede conexões seguras (HTTPS/SSL).');
            } else {
                console.log('\n✅ Ano parece correto.');
            }
        } catch (e) {
            console.error('Erro ao ler hora da internet:', e);
        }
    });
}).on('error', (err) => {
    console.error('Falha ao conectar na internet:', err.message);
});
