const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Login
    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            if(res.ok) {
                document.getElementById('tela-login').classList.add('d-none');
                document.getElementById('tela-painel').classList.remove('d-none');
                carregarReservas();
                carregarFotos();
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Email ou senha incorretos!');
            }
        } catch (erro) {
            alert('Erro ao tentar conectar com o servidor.');
        }
    });

    // Upload de Foto
    document.getElementById('form-upload').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('titulo', document.getElementById('foto-titulo').value);
        formData.append('categoria', document.getElementById('foto-categoria').value);
        formData.append('foto', document.getElementById('foto-arquivo').files[0]);

        try {
            const res = await fetch(`${API_URL}/galeria`, { method: 'POST', body: formData });
            if(res.ok) {
                alert('Foto enviada!');
                carregarFotos();
                e.target.reset();
            }
        } catch (erro) { alert('Erro ao enviar foto.'); }
    });

    // Salvar ou Atualizar Reserva (GERA PDF AO SALVAR)
    document.getElementById('form-reserva').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('reserva-id').value;
        const dados = {
            nome_cliente: document.getElementById('reserva-nome').value,
            data_evento: document.getElementById('reserva-data').value,
            status_pagamento: document.getElementById('reserva-status').value,
            detalhes_evento: document.getElementById('reserva-detalhes').value
        };

        try {
            let res;
            if (id) {
                res = await fetch(`${API_URL}/reservas/${id}`, { 
                    method: 'PUT', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(dados)
                });
            } else {
                res = await fetch(`${API_URL}/reservas`, { 
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(dados)
                });
            }

            if(res.ok) {
                alert(id ? 'Reserva atualizada e Comprovante gerado!' : 'Reserva criada e Comprovante gerado!');
                
                // MÁGICA DO PDF
                gerarComprovantePDF(dados);

                carregarReservas();
                limparFormularioReserva();
            } else {
                const erroData = await res.json();
                alert(`Atenção: ${erroData.error || 'Erro ao processar a reserva.'}`);
            }
        } catch (erro) { alert('Erro na conexão com o servidor.'); }
    });

    // Inicializar Calendário quando o modal abrir
    const modalCalendario = document.getElementById('modalCalendarioAdmin');
    modalCalendario.addEventListener('shown.bs.modal', () => {
        renderizarCalendarioAdmin();
    });
});

// --- FUNÇÃO PARA GERAR O PDF ---
function gerarComprovantePDF(dados) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Fonte padrão
    doc.setFont("helvetica");

    // 1. Cabeçalho (Nome da Empresa em Dourado)
    doc.setFontSize(22);
    doc.setTextColor(197, 160, 89); // Cor Dourada (--primary-gold)
    doc.text("Rauber Festas e Eventos", 105, 20, { align: "center" });

    // 2. Endereço
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100); // Cinza escuro
    doc.text("Rua Dr. Luzardo Ferreira de Melo, Centro", 105, 28, { align: "center" });
    doc.text("Itacoatiara - AM | CEP: 69100-075", 105, 34, { align: "center" });

    // Linha divisória
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 42, 190, 42);

    // 3. Título do Documento
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Preto
    doc.setFont("helvetica", "bold");
    doc.text("COMPROVANTE DE RESERVA", 105, 55, { align: "center" });

    // 4. Tratamento das Datas
    // Remove as horas caso a data venha do banco de dados (ex: 2026-02-27T00:00:00.000Z)
    const dataEventoApenas = dados.data_evento.split('T')[0];
    const [ano, mes, dia] = dataEventoApenas.split('-');
    const dataEventoFormatada = `${dia}/${mes}/${ano}`;
    
    // Data de hoje (Geração do PDF)
    const dataHojeObj = new Date();
    const dataGeracao = dataHojeObj.toLocaleDateString('pt-BR') + ' às ' + dataHojeObj.toLocaleTimeString('pt-BR');

    // Tradução do Status de Pagamento
    let statusTexto = '';
    if (dados.status_pagamento === 'NAO_PAGO') statusTexto = 'Não Pago';
    else if (dados.status_pagamento === 'PARCIAL') statusTexto = 'Pago Parcialmente (Sinal)';
    else if (dados.status_pagamento === 'PAGO') statusTexto = 'Totalmente Pago';
    else if (dados.status_pagamento === 'CONCLUIDO') statusTexto = 'Evento Concluído';

    // 5. Corpo do Recibo (Dados do Cliente)
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    
    let linhaY = 75;
    const espacoLinha = 10;

    doc.text(`Data de Emissão:`, 20, linhaY);
    doc.setFont("helvetica", "bold");
    doc.text(dataGeracao, 65, linhaY);
    doc.setFont("helvetica", "normal");
    
    linhaY += espacoLinha;
    doc.text(`Cliente:`, 20, linhaY);
    doc.setFont("helvetica", "bold");
    doc.text(dados.nome_cliente, 40, linhaY);
    doc.setFont("helvetica", "normal");

    linhaY += espacoLinha;
    doc.text(`Data do Evento:`, 20, linhaY);
    doc.setFont("helvetica", "bold");
    doc.text(dataEventoFormatada, 55, linhaY);
    doc.setFont("helvetica", "normal");

    linhaY += espacoLinha;
    doc.text(`Status Financeiro:`, 20, linhaY);
    doc.setFont("helvetica", "bold");
    doc.text(statusTexto, 60, linhaY);
    doc.setFont("helvetica", "normal");

    // 6. Descrição do Administrador
    linhaY += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Descrição / Observações do Evento:", 20, linhaY);
    
    linhaY += 8;
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    const descricao = dados.detalhes_evento ? dados.detalhes_evento : "Nenhuma observação informada no sistema.";
    const linhasDescricao = doc.splitTextToSize(descricao, 170);
    doc.text(linhasDescricao, 20, linhaY);

    // 7. Rodapé
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Este documento é um comprovante digital gerado automaticamente pelo sistema", 105, 275, { align: "center" });
    doc.text("Rauber Festas e Eventos.", 105, 280, { align: "center" });

    // Salva o arquivo
    const nomeArquivo = `Comprovante_${dados.nome_cliente.replace(/\s+/g, '_')}.pdf`;
    doc.save(nomeArquivo);
}

// Funções de Carregamento
async function carregarReservas() {
    const listaAtivos = document.getElementById('lista-reservas');
    const listaHistorico = document.getElementById('lista-historico');
    
    listaAtivos.innerHTML = '';
    listaHistorico.innerHTML = '';
    
    const res = await fetch(`${API_URL}/reservas`);
    const reservas = await res.json();

    reservas.forEach(r => {
        const dataObj = new Date(r.data_evento);
        const dataF = new Date(dataObj.getUTCFullYear(), dataObj.getUTCMonth(), dataObj.getUTCDate()).toLocaleDateString('pt-BR');
        
        let statusConfig = { 
            texto: 'Aguardando Pagamento', 
            classe: 'bg-status-NAO_PAGO', 
            badge: 'bg-danger bg-opacity-75',
            icon: 'fa-file-invoice-dollar' 
        };
        
        if(r.status_pagamento === 'PARCIAL') {
            statusConfig = { 
                texto: 'Sinal Pago', 
                classe: 'bg-status-PARCIAL', 
                badge: 'bg-warning text-dark',
                icon: 'fa-handshake' 
            };
        }
        
        if(r.status_pagamento === 'PAGO') {
            statusConfig = { 
                texto: 'Quitado', 
                classe: 'bg-status-PAGO', 
                badge: 'bg-success',
                icon: 'fa-check-double'
            };
        }
        
        if(r.status_pagamento === 'CONCLUIDO') {
            statusConfig = { 
                texto: 'Arquivado', 
                classe: 'bg-status-CONCLUIDO', 
                badge: 'bg-secondary',
                icon: 'fa-box-open'
            };
        }

        // Converte o objeto do banco para string segura para os botões do HTML
        const reservaSegura = JSON.stringify(r).replace(/'/g, "&apos;");

        let botoesAcao = '';
        if (r.status_pagamento !== 'CONCLUIDO') {
            // --- BOTÕES DOS EVENTOS ATIVOS (AGORA COM BOTÃO DE PDF) ---
            botoesAcao = `
                <div class="mt-3 d-flex gap-2 border-top pt-3 flex-wrap">
                    <button onclick='editarReserva(${reservaSegura})' class="btn btn-sm btn-outline-primary flex-grow-1" title="Editar">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="finalizarReserva(${r.id})" class="btn btn-sm btn-outline-success" title="Finalizar Evento">
                        <i class="fas fa-check"></i>
                    </button>
                    <button onclick='gerarComprovantePDF(${reservaSegura})' class="btn btn-sm btn-outline-secondary" title="Baixar PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button onclick="deletarReserva(${r.id})" class="btn btn-sm btn-outline-danger" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        } else {
            // --- BOTÕES DO HISTÓRICO (AGORA COM BOTÃO DE PDF) ---
            botoesAcao = `
                <div class="mt-3 text-end border-top pt-3 d-flex justify-content-between align-items-center">
                    <small class="text-muted">Histórico</small>
                    <div>
                        <button onclick='gerarComprovantePDF(${reservaSegura})' class="btn btn-action btn-sm btn-outline-secondary me-2">
                            <i class="fas fa-file-pdf"></i> PDF
                        </button>
                        <button onclick="deletarReserva(${r.id})" class="btn btn-action btn-sm btn-outline-danger">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    </div>
                </div>
            `;
        }

        const html = `
            <div class="col-md-6 col-lg-4">
                <div class="card event-card h-100 position-relative ps-3">
                    <div class="event-status-strip ${statusConfig.classe}"></div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="fw-bold mb-0 text-dark">${r.nome_cliente}</h5>
                            <span class="badge rounded-pill ${statusConfig.badge} shadow-sm">
                                <i class="fas ${statusConfig.icon} me-1"></i> ${statusConfig.texto}
                            </span>
                        </div>
                        
                        <h6 class="text-muted mb-3"><i class="far fa-calendar-alt me-2"></i>${dataF}</h6>
                        
                        <div class="p-2 bg-light rounded border mb-2 small text-secondary">
                            <i class="fas fa-info-circle me-1"></i> ${r.detalhes_evento || 'Sem observações.'}
                        </div>
                        
                        ${botoesAcao}
                    </div>
                </div>
            </div>
        `;

        if (r.status_pagamento === 'CONCLUIDO') {
            listaHistorico.innerHTML += html;
        } else {
            listaAtivos.innerHTML += html;
        }
    });
}

async function renderizarCalendarioAdmin() {
    const calendarEl = document.getElementById('calendarAdmin');
    
    const res = await fetch(`${API_URL}/reservas`);
    const reservas = await res.json();

    const eventos = reservas.map(r => {
        let cor = '#dc3545'; 
        if(r.status_pagamento === 'PARCIAL') cor = '#ffc107'; 
        if(r.status_pagamento === 'PAGO') cor = '#198754'; 
        if(r.status_pagamento === 'CONCLUIDO') cor = '#6c757d'; 

        return {
            title: `${r.nome_cliente} (${r.status_pagamento})`,
            start: r.data_evento.split('T')[0],
            backgroundColor: cor,
            borderColor: cor,   
            extendedProps: {
                detalhes: r.detalhes_evento,
                status: r.status_pagamento
            }
        };
    });

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        headerToolbar: {
            left: 'prev,next',
            center: 'title',
            right: 'today'
        },
        buttonText: { today: 'Hoje' },
        events: eventos,
        eventClick: function(info) {
            alert(`Evento: ${info.event.title}\nDetalhes: ${info.event.extendedProps.detalhes || 'Nenhum'}`);
        }
    });

    calendar.render();
}

async function finalizarReserva(id) {
    if(confirm('Tem certeza que deseja finalizar este evento? Ele irá para o histórico.')) {
        await fetch(`${API_URL}/reservas/${id}`, { 
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ status_pagamento: 'CONCLUIDO' })
        });
        carregarReservas();
    }
}

function editarReserva(r) {
    document.getElementById('reserva-id').value = r.id;
    document.getElementById('reserva-nome').value = r.nome_cliente;
    document.getElementById('reserva-data').value = r.data_evento.split('T')[0];
    document.getElementById('reserva-status').value = r.status_pagamento;
    document.getElementById('reserva-detalhes').value = r.detalhes_evento;

    document.getElementById('btn-salvar-reserva').innerText = 'Atualizar Evento';
    document.getElementById('btn-salvar-reserva').classList.replace('btn-success', 'btn-primary');
    document.getElementById('btn-cancelar-edicao').classList.remove('d-none');
    
    window.scrollTo(0, 0); 
}

function limparFormularioReserva() {
    document.getElementById('form-reserva').reset();
    document.getElementById('reserva-id').value = '';
    document.getElementById('btn-salvar-reserva').innerText = 'Salvar na Agenda';
    document.getElementById('btn-salvar-reserva').classList.replace('btn-primary', 'btn-success');
    document.getElementById('btn-cancelar-edicao').classList.add('d-none');
}

async function deletarReserva(id) {
    if(confirm('Tem certeza? Isso apagará permanentemente.')) {
        await fetch(`${API_URL}/reservas/${id}`, { method: 'DELETE' });
        carregarReservas();
    }
}

async function carregarFotos() {
    const container = document.getElementById('lista-fotos-admin');
    container.innerHTML = '';
    const res = await fetch(`${API_URL}/galeria`);
    const fotos = await res.json();
    fotos.forEach(f => {
        container.innerHTML += `
            <div class="col-md-3 text-center mb-3">
                <div class="border p-2 rounded">
                    <img src="http://localhost:3000${f.imagem_url}" class="img-fluid rounded mb-2" style="height: 100px; object-fit: cover;">
                    <p class="small mb-1 fw-bold text-truncate">${f.titulo}</p>
                    <span class="badge bg-info text-dark mb-2">${f.categoria}</span>
                    <button onclick="deletarFoto(${f.id})" class="btn btn-sm btn-danger w-100">Excluir</button>
                </div>
            </div>
        `;
    });
}

async function deletarFoto(id) {
    if(confirm('Apagar foto?')) {
        await fetch(`${API_URL}/galeria/${id}`, { method: 'DELETE' });
        carregarFotos();
    }
}

function logout() {
    window.location.reload();
}