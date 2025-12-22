# 🏰 Rauber Festas e Eventos - Sistema de Gestão

Sistema web desenvolvido para gerenciamento de agendamentos e vitrine virtual do espaço **Rauber Festas e Eventos**. O projeto conta com calendário interativo, galeria de fotos dinâmica e painel administrativo financeiro.

## 🚀 Tecnologias Utilizadas

- **Front-end:** HTML5, CSS3, Bootstrap 5, JavaScript (Vanilla), FullCalendar.
- **Back-end:** Node.js, Express.
- **Banco de Dados:** MySQL 8.
- **Outros:** Multer (Uploads), Cors.

## ⚙️ Funcionalidades

### 👤 Público (Vitrine)
- Visualização do espaço e planos.
- Calendário de disponibilidade (respeitando privacidade - LGPD).
- Galeria de fotos reais dos eventos.
- Links diretos para contato (WhatsApp).

## 📚 Documentação
O projeto foi desenvolvido seguindo a metodologia em espiral. Você pode conferir os diagramas UML, casos de uso e requisitos detalhados no documento oficial:

📄 **[Ver Documentação Completa (PDF)](docs/Rauber%20Festas%20e%20Eventos.pdf)**

### 🛡️ Administrativo (Gestão)
- **Login Seguro** (Simulado para MVP).
- **Gestão de Agenda:** Criar, Editar e Finalizar eventos.
- **Controle Financeiro:** Status visual (🔴 Não Pago | 🟡 Parcial | 🟢 Pago).
- **Histórico:** Registro de eventos concluídos.
- **Gestão de Mídia:** Upload e exclusão de fotos da galeria.

## 🛠️ Como Rodar o Projeto Localmente

### Pré-requisitos
- Node.js instalado.
- MySQL Workbench instalado e rodando.

### Passo 1: Configurar o Banco de Dados
1. Abra o arquivo `sql/database.sql` no MySQL Workbench.
2. Execute o script completo para criar o banco `rauber_db` e as tabelas.
3. **Atenção:** Verifique se a senha do seu banco local corresponde à configuração em `server/server.js`.

### Passo 2: Instalar Dependências
Abra o terminal na pasta server:
```bash
cd server
npm install
```

### Passo 3: Rodar o Servidor
Abra o terminal na pasta server:
`node server.js`
O servidor iniciará em http://localhost:3000.

### Passo 4: Acessar
Site: Acesse `http://localhost:3000` no seu navegador

Admin: Acesse `http://localhost:3000/admin.html`

Login: admin@rauber.com

Senha: rauber123

---

Desenvolvido por Luis Henrique Rauber.