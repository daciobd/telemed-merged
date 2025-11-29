# TeleMed API Contract

Especificação completa de endpoints entre Frontend (React/Wouter) e Backend (Express).

## 1. AUTH

### 1.1 POST /api/consultorio/login

**Autenticação:** Não requerida

**Request body (JSON)**
```json
{
  "email": "medico@exemplo.com",
  "password": "senha123"
}
```

**Response 200 (JSON)**
```json
{
  "token": "JWT_AQUI",
  "user": {
    "id": 123,
    "fullName": "Dr. Fulano",
    "role": "doctor",
    "email": "medico@exemplo.com"
  }
}
```

**Response 401 (Erro de credenciais)**
```json
{
  "message": "Credenciais inválidas."
}
```

---

### 1.2 GET /api/consultorio/me

**Autenticação:** Requerida (`Authorization: Bearer <JWT>`)

**Response 200 (JSON)**
```json
{
  "user": {
    "id": 123,
    "fullName": "Dr. Fulano",
    "role": "doctor",
    "email": "medico@exemplo.com"
  }
}
```

**Response 401 (Sem login válido)**
```json
{
  "message": "Não autenticado."
}
```

---

## 2. DOCTOR

### 2.1 GET /api/doctor/dashboard

**Autenticação:** Requerida (`Authorization: Bearer <JWT_DOCTOR>`)

**Response 200 (JSON)**
```json
{
  "doctor": {
    "fullName": "Dr. Fulano",
    "accountType": "virtual_office",
    "customUrl": "dr-fulano",
    "totalConsultations": 22,
    "monthRevenue": 5400.75
  }
}
```

- `accountType`: `"marketplace"` | `"virtual_office"` | `"hybrid"`
- Campos numéricos podem ser 0

---

### 2.2 PATCH /api/doctor/account-type

**Autenticação:** Requerida

**Request body**
```json
{
  "accountType": "virtual_office"
}
```

**Response 200 (JSON)**
```json
{
  "doctor": {
    "accountType": "virtual_office"
  }
}
```

---

### 2.3 GET /api/doctor/my-patients?search=...

**Autenticação:** Requerida

**Query params:** `search` (opcional) – filtro por nome/email

**Response 200 (JSON)**
```json
{
  "patients": [
    {
      "id": 1,
      "fullName": "Maria Silva",
      "email": "maria@example.com",
      "phone": "+55 11 99999-0000",
      "lastConsultationDate": "2025-11-20T14:00:00.000Z",
      "totalConsultations": 3
    }
  ]
}
```

---

## 3. CONSULTÓRIO VIRTUAL – MÉDICO (SETTINGS)

### 3.1 GET /api/virtual-office/settings

**Autenticação:** Requerida

**Response 200 (JSON)**
```json
{
  "settings": {
    "customUrl": "dr-fulano",
    "primeira_consulta": 300,
    "retorno": 200,
    "urgente": 400,
    "check_up": 250,
    "autoAccept": true,
    "workDays": ["mon", "tue", "wed", "thu", "fri"],
    "startTime": "08:00",
    "endTime": "18:00"
  }
}
```

---

### 3.2 POST /api/virtual-office/settings

**Autenticação:** Requerida

**Request body**
```json
{
  "customUrl": "dr-fulano",
  "primeira_consulta": 300,
  "retorno": 200,
  "urgente": 400,
  "check_up": 250,
  "autoAccept": true,
  "workDays": ["mon", "tue", "wed", "thu", "fri"],
  "startTime": "08:00",
  "endTime": "18:00"
}
```

**Response 200 (JSON)** – mesma estrutura da request

**Response 409 (URL já existe)**
```json
{
  "message": "Esta URL já está em uso."
}
```

---

## 4. CONSULTÓRIO VIRTUAL – PÚBLICO

### 4.1 GET /api/virtual-office/:customUrl

**Autenticação:** Não requerida (público)

**Response 200 (JSON)**
```json
{
  "doctor": {
    "id": 123,
    "fullName": "Dr. Fulano da Silva",
    "specialties": ["Cardiologia"],
    "bio": "Texto livre...",
    "consultationPricing": {
      "primeira_consulta": 300,
      "retorno": 200,
      "urgente": 400
    }
  }
}
```

**Response 404**
```json
{
  "message": "Médico não encontrado."
}
```

---

### 4.2 GET /api/virtual-office/:customUrl/slots?date=YYYY-MM-DD

**Autenticação:** Não requerida

**Query param:** `date` – formato `YYYY-MM-DD`

**Response 200 (JSON)**
```json
{
  "slots": ["08:00", "08:30", "09:00", "09:30"]
}
```

Se não houver horários:
```json
{
  "slots": []
}
```

---

### 4.3 POST /api/virtual-office/:customUrl/book

**Autenticação:** Não requerida (público)

**Request body**
```json
{
  "doctorId": 123,
  "date": "2025-11-29",
  "time": "09:00",
  "consultationType": "primeira_consulta"
}
```

**Response 201 (JSON)**
```json
{
  "consultation": {
    "id": 789,
    "doctorId": 123,
    "date": "2025-11-29",
    "time": "09:00",
    "status": "scheduled"
  }
}
```

**Response 400 (Horário indisponível)**
```json
{
  "message": "Este horário está indisponível."
}
```

---

## Notas Importantes

1. **Token JWT**: Guardado em `localStorage` com chave `telemed_token`
2. **Header Authorization**: `Authorization: Bearer <token>`
3. **Campos de preço**: `primeira_consulta`, `retorno`, `urgente`, `check_up`
4. **Nomes de campos no backend**: Use `fullName`, `specialties` (array)
5. **Response de erro**: Sempre inclua `message` para o frontend exibir em toast

---

## Testing Credentials

```
Email: demo@telemed.com.br
Password: senha123
Role: doctor
```
