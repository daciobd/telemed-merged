// Agenda Médica - JavaScript Principal
// Sistema integrado com informações de pacientes

// Mock data para demonstração
const mockAppointments = {
    18: [
        { id: 1, time: '08:00', patient: 'Bruno Peixoto Alberto da Silva', status: 'Confirmado', type: 'Consulta de rotina' },
        { id: 2, time: '09:30', patient: 'William Lopes do Nascimento', status: 'Aguardando', type: 'Psiquiatria' },
        { id: 3, time: '11:00', patient: 'Maria Santos Oliveira', status: 'Confirmado', type: 'Ginecologia' }
    ],
    19: [
        { id: 4, time: '14:00', patient: 'João Silva Costa', status: 'Aguardando', type: 'Cardiologia' },
        { id: 5, time: '15:30', patient: 'Ana Beatriz Lima', status: 'Confirmado', type: 'Dermatologia' }
    ],
    20: [
        { id: 6, time: '10:00', patient: 'Carlos Roberto Mendes', status: 'Confirmado', type: 'Ortopedia' },
        { id: 7, time: '14:00', patient: 'Fernanda Almeida', status: 'Aguardando', type: 'Pediatria' }
    ]
};

let currentMonth = 7; // Agosto (0-indexed)
let currentYear = 2025;
let selectedDay = 18;

const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function initCalendar() {
    updateCalendarDisplay();
    updateAppointmentsList();
    
    // Event listeners
    document.getElementById('prevMonth').onclick = () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendarDisplay();
    };

    document.getElementById('nextMonth').onclick = () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendarDisplay();
    };

    // Notificações toggle
    const notificationsToggle = document.getElementById('notificationsToggle');
    if (notificationsToggle) {
        notificationsToggle.onchange = function() {
            if (this.checked) {
                const modal = document.getElementById('notificationsModal');
                if (modal) modal.style.display = 'block';
            }
        };
    }

    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.onclick = () => {
            const modal = document.getElementById('notificationsModal');
            if (modal) modal.style.display = 'none';
        };
    }

    // Botão nova consulta
    const newAppointmentBtn = document.getElementById('newAppointmentBtn');
    if (newAppointmentBtn) {
        newAppointmentBtn.onclick = () => scheduleNewAppointment(selectedDay);
    }
}

function updateCalendarDisplay() {
    const currentMonthEl = document.getElementById('currentMonth');
    if (currentMonthEl) {
        currentMonthEl.textContent = `${months[currentMonth]} ${currentYear}`;
    }
    
    const calendarBody = document.getElementById('calendarBody');
    if (!calendarBody) return;
    
    calendarBody.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let day = 1;
    for (let week = 0; week < 6; week++) {
        const row = document.createElement('tr');
        
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
            const cell = document.createElement('td');
            cell.className = 'calendar-day';
            
            if (week === 0 && dayOfWeek < firstDay) {
                cell.textContent = '';
            } else if (day > daysInMonth) {
                cell.textContent = '';
            } else {
                cell.textContent = day;
                cell.onclick = () => selectDay(day);
                
                // Marcar dia atual
                const today = new Date();
                if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                    cell.classList.add('today');
                }
                
                // Marcar dia selecionado
                if (day === selectedDay) {
                    cell.classList.add('selected');
                }
                
                // Marcar dias com consultas
                if (mockAppointments[day]) {
                    cell.classList.add('has-appointments');
                    cell.title = `${mockAppointments[day].length} consulta(s) agendada(s)`;
                }
                
                day++;
            }
            
            row.appendChild(cell);
        }
        
        calendarBody.appendChild(row);
        if (day > daysInMonth) break;
    }
}

function selectDay(day) {
    selectedDay = day;
    updateCalendarDisplay();
    updateAppointmentsList();
}

function updateAppointmentsList() {
    const appointments = mockAppointments[selectedDay] || [];
    const appointmentsList = document.getElementById('appointmentsList');
    if (!appointmentsList) return;
    
    // Atualizar título
    const scheduleDate = document.getElementById('scheduleDate');
    if (scheduleDate) {
        scheduleDate.textContent = `Horários para ${selectedDay}/${currentMonth + 1}/${currentYear}`;
    }
    
    appointmentsList.innerHTML = '';
    
    if (appointments.length === 0) {
        appointmentsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>Nenhum agendamento para este dia</p>
                <button class="btn primary" onclick="scheduleNewAppointment(${selectedDay})">➕ Agendar Consulta</button>
            </div>
        `;
        return;
    }
    
    appointments.forEach(appt => {
        const appointmentEl = document.createElement('div');
        appointmentEl.className = 'appointment-item';
        appointmentEl.innerHTML = `
            <div class="appointment-info">
                <div class="appointment-time">${appt.time}</div>
                <div class="appointment-patient" onclick="goToPatientInfo(${appt.id})" style="cursor: pointer; color: #4f46e5; font-weight: 500;" title="Clique para ver informações do paciente">
                    ${appt.patient}
                </div>
                <div class="appointment-type">${appt.type}</div>
                <div class="appointment-status status-${appt.status.toLowerCase().replace(' ', '-')}">${appt.status}</div>
            </div>
            <div class="appointment-actions">
                <button class="action-btn info" onclick="goToPatientInfo(${appt.id})" title="Informações do Paciente">
                    👤
                </button>
                <button class="action-btn video" onclick="startVideoCall(${appt.id})" title="Iniciar Consulta">
                    🎥
                </button>
                <button class="action-btn edit" onclick="editAppointment(${appt.id})" title="Editar">
                    ✏️
                </button>
                <button class="action-btn delete" onclick="deleteAppointment(${appt.id})" title="Cancelar">
                    🗑️
                </button>
            </div>
        `;
        appointmentsList.appendChild(appointmentEl);
    });
}

function goToPatientInfo(appointmentId) {
    // Mapear ID do agendamento para ID do paciente
    const patientMap = { 
        1: 1, // Bruno Peixoto
        2: 2, // William Lopes  
        3: 3, // Maria Santos
        4: 1, // João Silva -> Bruno (exemplo)
        5: 2, // Ana Beatriz -> William (exemplo)
        6: 1, // Carlos Roberto -> Bruno (exemplo)
        7: 3  // Fernanda -> Maria (exemplo)
    };
    const patientId = patientMap[appointmentId] || 1;
    
    console.log(`📋 Navegando para informações do paciente. Agendamento: ${appointmentId}, Paciente: ${patientId}`);
    window.location.href = `/patient-info?patient=${patientId}&appointment=${appointmentId}`;
}

function startVideoCall(appointmentId) {
    const patientMap = { 
        1: 1, 2: 2, 3: 3, 4: 1, 5: 2, 6: 1, 7: 3
    };
    const patientId = patientMap[appointmentId] || 1;
    
    console.log(`🎥 Iniciando consulta de vídeo. Agendamento: ${appointmentId}, Paciente: ${patientId}`);
    window.location.href = `/consulta?patient=${patientId}&appointment=${appointmentId}`;
}

function editAppointment(id) {
    const appointment = Object.values(mockAppointments)
        .flat()
        .find(appt => appt.id === id);
    
    if (appointment) {
        const newTime = prompt(`Editar horário da consulta:\n\nPaciente: ${appointment.patient}\nHorário atual: ${appointment.time}\n\nNovo horário:`, appointment.time);
        
        if (newTime && newTime !== appointment.time) {
            appointment.time = newTime;
            updateAppointmentsList();
            alert(`Horário atualizado para ${newTime}`);
        }
    }
}

function deleteAppointment(id) {
    const appointment = Object.values(mockAppointments)
        .flat()
        .find(appt => appt.id === id);
    
    if (appointment && confirm(`Tem certeza que deseja cancelar a consulta?\n\nPaciente: ${appointment.patient}\nHorário: ${appointment.time}`)) {
        // Remover da lista
        for (const day in mockAppointments) {
            mockAppointments[day] = mockAppointments[day].filter(appt => appt.id !== id);
            if (mockAppointments[day].length === 0) {
                delete mockAppointments[day];
            }
        }
        
        updateCalendarDisplay();
        updateAppointmentsList();
        alert('Consulta cancelada com sucesso.');
    }
}

function scheduleNewAppointment(day) {
    const patientName = prompt(`Agendar nova consulta para ${day}/${currentMonth + 1}/${currentYear}\n\nNome do paciente:`);
    const time = prompt('Horário (ex: 14:30):');
    const type = prompt('Tipo de consulta:', 'Consulta de rotina');
    
    if (patientName && time) {
        if (!mockAppointments[day]) {
            mockAppointments[day] = [];
        }
        
        const newId = Math.max(...Object.values(mockAppointments).flat().map(a => a.id)) + 1;
        
        mockAppointments[day].push({
            id: newId,
            time: time,
            patient: patientName,
            status: 'Agendado',
            type: type || 'Consulta de rotina'
        });
        
        mockAppointments[day].sort((a, b) => a.time.localeCompare(b.time));
        
        updateCalendarDisplay();
        updateAppointmentsList();
        alert(`Consulta agendada com sucesso!\n\nPaciente: ${patientName}\nData: ${day}/${currentMonth + 1}/${currentYear}\nHorário: ${time}`);
    }
}

// Adicionar estilos CSS dinâmicos se não existirem
function addStyles() {
    if (document.getElementById('agenda-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'agenda-styles';
    style.textContent = `
        .appointment-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            margin-bottom: 0.5rem;
            background: var(--card, #1e293b);
            border-radius: 8px;
            border: 1px solid var(--border, rgba(255,255,255,0.1));
            transition: all 0.2s;
        }

        .appointment-item:hover {
            background: var(--surface, #334155);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .appointment-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            flex: 1;
        }

        .appointment-time {
            font-weight: 600;
            color: var(--secondary, #60a5fa);
            font-size: 0.9rem;
        }

        .appointment-patient {
            font-weight: 500;
            color: var(--text, #e5e7eb);
            transition: color 0.2s;
        }

        .appointment-patient:hover {
            color: #4f46e5;
            text-decoration: underline;
        }

        .appointment-type {
            color: var(--text-muted, #9ca3af);
            font-size: 0.8rem;
        }

        .appointment-status {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 500;
            width: fit-content;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .status-confirmado {
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status-aguardando {
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
            border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .status-agendado {
            background: rgba(59, 130, 246, 0.15);
            color: #3b82f6;
            border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .appointment-actions {
            display: flex;
            gap: 0.5rem;
        }

        .action-btn {
            padding: 0.6rem;
            border: none;
            border-radius: 6px;
            background: var(--surface, #374151);
            cursor: pointer;
            transition: all 0.2s;
            font-size: 1rem;
            color: var(--text, #e5e7eb);
            min-width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .action-btn:hover {
            background: var(--secondary, #4f46e5);
            transform: scale(1.1);
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .action-btn.info:hover {
            background: #3b82f6;
        }

        .action-btn.video:hover {
            background: #10b981;
        }

        .action-btn.edit:hover {
            background: #f59e0b;
        }

        .action-btn.delete:hover {
            background: #ef4444;
        }

        .calendar-day.has-appointments {
            background: rgba(79, 70, 229, 0.15);
            color: #4f46e5;
            font-weight: 600;
            position: relative;
        }

        .calendar-day.has-appointments::after {
            content: '';
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            background: #4f46e5;
            border-radius: 50%;
        }

        .calendar-day.selected {
            background: var(--secondary, #4f46e5);
            color: white;
            font-weight: 600;
        }

        .calendar-day.today {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
            font-weight: 600;
            border: 2px solid #10b981;
        }

        .empty-state {
            text-align: center;
            padding: 3rem 1rem;
            color: var(--text-muted, #9ca3af);
        }

        .empty-state-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.6;
        }

        @media (max-width: 768px) {
            .appointment-item {
                flex-direction: column;
                align-items: stretch;
                gap: 1rem;
            }

            .appointment-actions {
                justify-content: center;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Inicializar quando a página carregar
window.addEventListener('DOMContentLoaded', () => {
    addStyles();
    initCalendar();
});

// Exportar funções para uso global
window.goToPatientInfo = goToPatientInfo;
window.startVideoCall = startVideoCall;
window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;
window.scheduleNewAppointment = scheduleNewAppointment;