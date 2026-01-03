const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Login
    document.getElementById('form-login').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        if(email === 'admin@rauber.com' && senha === 'rauber123') {
            document.getElementById('tela-login').classList.add('d-none');
            document.getElementById('tela-painel').classList.remove('d-none');
            carregarReservas();
            carregarFotos();
        } else {
            alert('Email ou senha incorretos!');
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

    // Salvar ou Atualizar Reserva
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
                alert(id ? 'Reserva atualizada!' : 'Reserva criada!');
                carregarReservas();
                limparFormularioReserva();
            }
        } catch (erro) { alert('Erro ao salvar.'); }
    });

    // --- NOVO: INICIALIZAR CALENDÁRIO QUANDO O MODAL ABRIR ---
    const modalCalendario = document.getElementById('modalCalendarioAdmin');
    modalCalendario.addEventListener('shown.bs.modal', () => {
        renderizarCalendarioAdmin();
    });
});

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
        
        // --- CONFIGURAÇÃO DOS NOVOS ÍCONES MODERNOS ---
        let statusConfig = { 
            texto: 'Aguardando Pagamento', 
            classe: 'bg-status-NAO_PAGO', 
            badge: 'bg-danger bg-opacity-75', // Vermelho mais suave
            icon: 'fa-file-invoice-dollar'     // Ícone de Fatura
        };
        
        if(r.status_pagamento === 'PARCIAL') {
            statusConfig = { 
                texto: 'Sinal Pago', 
                classe: 'bg-status-PARCIAL', 
                badge: 'bg-warning text-dark',
                icon: 'fa-handshake'           // Ícone de Acordo/Sinal
            };
        }
        
        if(r.status_pagamento === 'PAGO') {
            statusConfig = { 
                texto: 'Quitado', 
                classe: 'bg-status-PAGO', 
                badge: 'bg-success',
                icon: 'fa-check-double'        // Duplo Check (Confirmado)
            };
        }
        
        if(r.status_pagamento === 'CONCLUIDO') {
            statusConfig = { 
                texto: 'Arquivado', 
                classe: 'bg-status-CONCLUIDO', 
                badge: 'bg-secondary',
                icon: 'fa-box-open'            // Ícone de Caixa/Arquivo
            };
        }

        let botoesAcao = '';
        if (r.status_pagamento !== 'CONCLUIDO') {
            botoesAcao = `
                <div class="mt-3 d-flex gap-2 border-top pt-3">
                    <button onclick='editarReserva(${JSON.stringify(r)})' class="btn btn-action btn-outline-primary flex-grow-1">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="finalizarReserva(${r.id})" class="btn btn-action btn-outline-success flex-grow-1" title="Mover para Histórico">
                        <i class="fas fa-check"></i> Finalizar
                    </button>
                    <button onclick="deletarReserva(${r.id})" class="btn btn-action btn-outline-danger" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        } else {
            botoesAcao = `
                <div class="mt-3 text-end border-top pt-3">
                    <small class="text-muted me-2">Histórico</small>
                    <button onclick="deletarReserva(${r.id})" class="btn btn-action btn-sm btn-outline-danger">
                        <i class="fas fa-trash"></i> Remover
                    </button>
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

// --- NOVO: RENDERIZAR CALENDÁRIO NO MODAL ---
async function renderizarCalendarioAdmin() {
    const calendarEl = document.getElementById('calendarAdmin');
    
    // Busca reservas
    const res = await fetch(`${API_URL}/reservas`);
    const reservas = await res.json();

    // Mapeia para o formato do FullCalendar
    const eventos = reservas.map(r => {
        let cor = '#dc3545'; // Vermelho (Padrão/Não pago)
        if(r.status_pagamento === 'PARCIAL') cor = '#ffc107'; // Amarelo
        if(r.status_pagamento === 'PAGO') cor = '#198754'; // Verde
        if(r.status_pagamento === 'CONCLUIDO') cor = '#6c757d'; // Cinza

        return {
            title: `${r.nome_cliente} (${r.status_pagamento})`,
            start: r.data_evento.split('T')[0],
            backgroundColor: cor,
            borderColor: cor,   
            // Dados extras para usar no click
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
            // Mostra detalhes ao clicar no evento
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