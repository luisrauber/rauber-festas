const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa calendário
    inicializarCalendario();
    
    // Carrega a galeria e, SÓ DEPOIS, configura os filtros
    carregarGaleria().then(() => {
        configurarFiltros();
    });
});

// ============================================================
// 1. CALENDÁRIO
// ============================================================
async function inicializarCalendario() {
    const calendarEl = document.getElementById('calendar');
    if(!calendarEl) return;

    try {
        const res = await fetch(`${API_URL}/reservas/publicas`);
        const datas = await res.json();
        
        const eventosOcupados = datas.map(dataObj => {
            const dataString = dataObj.data_evento.split('T')[0];
            return {
                title: 'INDISPONÍVEL',
                start: dataString,
                display: 'background',
                backgroundColor: '#dc3545'
            };
        });

        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'pt-br',
            height: 'auto',
            headerToolbar: { left: 'prev,next', center: 'title', right: 'today' },
            buttonText: { today: 'Hoje' },
            events: eventosOcupados
        });

        calendar.render();

    } catch (erro) {
        console.error("Erro ao carregar calendário:", erro);
    }
}

// ============================================================
// 2. GALERIA DE FOTOS (Versão Segura - Sem Animação)
// ============================================================
async function carregarGaleria() {
    const container = document.getElementById('galeria-container');
    if(!container) return;

    try {
        const res = await fetch(`${API_URL}/galeria`);
        const fotos = await res.json();

        container.innerHTML = ''; 

        if(fotos.length === 0) {
            container.innerHTML = '<p class="text-center text-muted w-100">Nenhuma foto na galeria.</p>';
            return;
        }

        fotos.forEach(foto => {
            // REMOVI O 'data-aos' PARA GARANTIR VISIBILIDADE
            const html = `
            <div class="col-md-4 col-sm-6 filter-item ${foto.categoria}">
                <div class="gallery-item shadow-sm" style="border-radius: 10px; overflow: hidden;">
                    <img src="http://localhost:3000${foto.imagem_url}" class="img-fluid" alt="${foto.titulo}" 
                         style="width: 100%; height: 300px; object-fit: cover;" 
                         onerror="this.parentElement.innerHTML='<div class=\'text-center p-5 bg-light\'>Foto não encontrada</div>'">
                    <div class="overlay">
                        <div class="text">${foto.titulo}</div>
                    </div>
                </div>
            </div>
            `;
            container.innerHTML += html;
        });
        
        // Configura os filtros novamente após carregar
        configurarFiltros();

    } catch (erro) {
        console.error("Erro ao carregar galeria:", erro);
    }
}
// ============================================================
// 3. FILTROS DA GALERIA (Lógica Simplificada)
// ============================================================
function configurarFiltros() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. Gerencia classe 'active' dos botões
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterValue = btn.getAttribute('data-filter');
            const items = document.querySelectorAll('.filter-item');
            
            // 2. Mostra ou Esconde usando d-none do Bootstrap
            items.forEach(item => {
                if (filterValue === 'all' || item.classList.contains(filterValue)) {
                    item.classList.remove('d-none');
                } else {
                    item.classList.add('d-none');
                }
            });

            // 3. Recalcula a animação (Isso corrige o bug de sumir ao rolar)
            setTimeout(() => {
                if(typeof AOS !== 'undefined') AOS.refresh();
            }, 100);
        });
    });
}