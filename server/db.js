const mysql = require('mysql2');

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    
    // !!! COLOQUE SUA SENHA DO WORKBENCH AQUI !!!
    password: '1234', 
    
    // Usando a porta 3305 que funcionou no seu outro projeto
    port: 3305, 
    
    database: 'rauber_db'
});

module.exports = pool.promise();