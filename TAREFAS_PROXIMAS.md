# 📝 TAREFAS PRÓXIMAS - TeleMed Consultório

## ⏰ SEMANA 1: FRONTEND CONSULTÓRIO

### TAREFA 1: Página Pública do Médico (CRÍTICA)
**Arquivo:** `/apps/medical-desk-advanced/client/src/pages/dr/[customUrl].tsx`

```typescript
// Estrutura básica:
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';

export default function DoctorPublicPage() {
  const { customUrl } = useParams();
  const { data: doctor, isLoading } = useQuery({
    queryKey: ['virtual-office', customUrl],
    queryFn: () => fetch(`/api/virtual-office/${customUrl}`).then(r => r.json())
  });

  if (isLoading) return <Loading />;

  return (
    <div>
      <DoctorProfile doctor={doctor} />
      <PricingDisplay pricing={doctor.consultationPricing} />
      <BookingCalendar doctorId={doctor.id} customUrl={customUrl} />
    </div>
  );
}
```

**Componentes necessários:**
- `<DoctorProfile />`: nome, CRM, especialidade, rating, bio
- `<PricingDisplay />`: tabela de preços
- `<BookingCalendar />`: seleção de horário + botão agendar

---

### TAREFA 2: Setup/Configuração do Consultório
**Arquivo:** `/apps/medical-desk-advanced/client/src/pages/doctor/virtual-office-setup.tsx`

```typescript
// Formulário com campos:
// 1. URL Personalizada (com validação unique)
// 2. Preços (primeira_consulta, retorno, urgente, check_up)
// 3. Horários (calendário por dia da semana)
// 4. Plano (basic/professional/premium)
// 5. Botão salvar → PATCH /api/virtual-office/settings
```

---

### TAREFA 3: Lista de Pacientes
**Arquivo:** `/apps/medical-desk-advanced/client/src/pages/doctor/my-patients.tsx`

```typescript
// Tabela com:
// - Nome paciente
// - Última consulta (data)
// - Próxima agendada
// - Ações: Lembrete, Follow-up
// 
// Fetch: GET /api/virtual-office/my-patients
```

---

## 🧪 TESTES A FAZER AGORA

```bash
# 1. Teste Seed
curl -X POST http://localhost:5000/api/seed

# 2. Teste dados público do médico
curl http://localhost:5000/api/virtual-office/dra-anasilva

# 3. Teste settings (com token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/virtual-office/settings
```

---

## 📅 CRONOGRAMA

| Fase | O que | Quando | % |
|------|------|--------|-----|
| 1 | Página pública `/dr/[customUrl]` | Esta semana | 30% |
| 2 | Setup `/doctor/virtual-office-setup` | Esta semana | 30% |
| 3 | Pacientes `/doctor/my-patients` | Próxima semana | 20% |
| 4 | Integração Billing | Após semana 2 | 10% |
| 5 | Notificações | Após semana 3 | 10% |

---

**Status Atual:** 60% pronto para testar  
**Bottleneck:** Frontend pages faltando (pode ser feito em 3-4 dias)
