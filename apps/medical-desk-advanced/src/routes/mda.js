import { Router } from "express";
const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "medical-desk-advanced",
    time: new Date().toISOString()
  });
});

const protocolsDatabase = {
  hipertensao: {
    name: "Hipertensão Arterial Sistêmica",
    description: "Doença cardiovascular crônica caracterizada por níveis elevados de pressão arterial (≥140/90 mmHg).",
    diagnosis: {
      criteria: "PA ≥ 140/90 mmHg em pelo menos 2 consultas, MAPA ou MRPA confirmando valores elevados",
      exams: [
        "ECG de repouso",
        "Ecocardiograma (se suspeita de lesão de órgão-alvo)",
        "Creatinina sérica e clearance",
        "Potássio sérico",
        "Glicemia de jejum",
        "Perfil lipídico completo",
        "Exame de urina tipo 1"
      ]
    },
    treatment: {
      lifestyle: [
        "Redução do consumo de sódio (<2g/dia)",
        "Dieta DASH (rica em frutas, vegetais, grãos integrais)",
        "Exercícios aeróbicos (150min/semana)",
        "Perda de peso se IMC >25",
        "Redução do consumo de álcool",
        "Cessação do tabagismo"
      ],
      medications: [
        {
          class: "IECA (Inibidores da ECA)",
          examples: ["Enalapril 5-40mg/dia", "Captopril 25-150mg/dia", "Lisinopril 10-40mg/dia"],
          line: "1ª linha"
        },
        {
          class: "BRA (Bloqueadores dos receptores de angiotensina)",
          examples: ["Losartana 50-100mg/dia", "Valsartana 80-320mg/dia"],
          line: "1ª linha (alternativa a IECA)"
        },
        {
          class: "Diuréticos tiazídicos",
          examples: ["Hidroclorotiazida 12.5-25mg/dia", "Clortalidona 12.5-25mg/dia"],
          line: "1ª linha (associação)"
        },
        {
          class: "Bloqueadores de canal de cálcio",
          examples: ["Anlodipino 5-10mg/dia", "Nifedipino 30-60mg/dia"],
          line: "1ª linha"
        }
      ]
    },
    followup: {
      frequency: "A cada 3-6 meses após controle adequado (trimestral se não controlado)",
      monitoring: ["Pressão arterial", "Creatinina", "Potássio", "Glicemia", "Peso"]
    }
  },
  diabetes: {
    name: "Diabetes Mellitus Tipo 2",
    description: "Doença metabólica crônica caracterizada por hiperglicemia devido à resistência insulínica e/ou deficiência de insulina.",
    diagnosis: {
      criteria: "Glicemia de jejum ≥126 mg/dL (2x), HbA1c ≥6.5%, ou glicemia casual ≥200 mg/dL + sintomas",
      exams: [
        "Glicemia de jejum",
        "Hemoglobina glicada (HbA1c)",
        "Perfil lipídico",
        "Creatinina e TFG",
        "Exame de urina (microalbuminúria)",
        "Fundoscopia (rastreio retinopatia)"
      ]
    },
    treatment: {
      lifestyle: [
        "Dieta hipocalórica (redução de 500-750 kcal/dia)",
        "Redução de carboidratos simples",
        "Aumento de fibras (25-30g/dia)",
        "Exercícios aeróbicos + resistência (150min/semana)",
        "Perda de peso (meta: 5-10% do peso inicial)",
        "Cessação do tabagismo"
      ],
      medications: [
        {
          class: "Biguanidas",
          examples: ["Metformina 500-2000mg/dia (doses divididas)"],
          line: "1ª linha"
        },
        {
          class: "iSGLT2 (Inibidores SGLT2)",
          examples: ["Dapagliflozina 10mg/dia", "Empagliflozina 10-25mg/dia"],
          line: "2ª linha (proteção cardiovascular/renal)"
        },
        {
          class: "GLP-1 agonistas",
          examples: ["Liraglutida 1.2-1.8mg SC/dia", "Semaglutida 0.5-1mg SC/semana"],
          line: "2ª linha (perda de peso + proteção CV)"
        },
        {
          class: "Sulfonilureias",
          examples: ["Glicazida 30-120mg/dia", "Glimepirida 1-4mg/dia"],
          line: "2ª linha (custo-efetivo)"
        }
      ]
    },
    followup: {
      frequency: "A cada 3 meses (HbA1c trimestral)",
      monitoring: ["HbA1c", "Glicemia capilar", "Peso", "PA", "Perfil lipídico anual", "Creatinina/TFG", "Exame de fundo de olho anual"]
    }
  },
  iam: {
    name: "Infarto Agudo do Miocárdio (IAM)",
    description: "Síndrome coronariana aguda causada por oclusão coronariana com necrose miocárdica.",
    diagnosis: {
      criteria: "Dor torácica típica + elevação de troponina + alterações no ECG (supradesnivelamento ST ou infradesnivelamento)",
      exams: [
        "ECG de 12 derivações (URGENTE)",
        "Troponina I ou T seriada (0h, 3h, 6h)",
        "CK-MB massa",
        "Ecocardiograma",
        "Cateterismo cardíaco (dentro de 90min se IAMCSST)",
        "Raio-X de tórax"
      ]
    },
    treatment: {
      lifestyle: [
        "Repouso absoluto nas primeiras 24-48h",
        "Dieta hipossódica e hipogordurosa",
        "Cessação imediata do tabagismo",
        "Reabilitação cardíaca precoce (fase 2: após 2-3 semanas)",
        "Controle rigoroso de fatores de risco"
      ],
      medications: [
        {
          class: "Antiagregantes plaquetários (EMERGÊNCIA)",
          examples: ["AAS 200-300mg (ataque), depois 100mg/dia", "Clopidogrel 300-600mg (ataque), depois 75mg/dia (dupla antiagregação)"],
          line: "1ª linha - URGENTE"
        },
        {
          class: "Betabloqueadores",
          examples: ["Metoprolol 25-100mg 12/12h", "Carvedilol 3.125-25mg 12/12h"],
          line: "1ª linha (reduz mortalidade)"
        },
        {
          class: "IECA/BRA",
          examples: ["Ramipril 2.5-10mg/dia", "Enalapril 5-20mg/dia"],
          line: "1ª linha (remodelamento ventricular)"
        },
        {
          class: "Estatinas (alta potência)",
          examples: ["Atorvastatina 80mg/dia", "Rosuvastatina 20-40mg/dia"],
          line: "1ª linha"
        },
        {
          class: "Anticoagulação (se indicado)",
          examples: ["Heparina não-fracionada ou Enoxaparina"],
          line: "Fase aguda"
        }
      ]
    },
    followup: {
      frequency: "Consulta em 7-14 dias pós-alta, depois mensal por 3 meses, depois trimestral",
      monitoring: ["ECG", "Ecocardiograma (1-3 meses)", "Teste ergométrico (4-6 semanas)", "Perfil lipídico", "Troponina (se sintomas recorrentes)"]
    }
  },
  asma: {
    name: "Asma Brônquica",
    description: "Doença inflamatória crônica das vias aéreas caracterizada por hiper-reatividade brônquica e obstrução reversível ao fluxo aéreo.",
    diagnosis: {
      criteria: "Sintomas respiratórios variáveis (sibilância, dispneia, tosse) + reversibilidade na espirometria (VEF1 >12% e 200ml após broncodilatador)",
      exams: [
        "Espirometria com broncodilatador",
        "Pico de fluxo expiratório (PFE)",
        "Teste de provocação bronquial (se espirometria normal)",
        "Raio-X de tórax (excluir outras causas)",
        "IgE total e específica (se alergia suspeitada)"
      ]
    },
    treatment: {
      lifestyle: [
        "Evitar alérgenos identificados (ácaros, pólen, pelos de animais)",
        "Controle ambiental (capa antiácaro, limpeza frequente)",
        "Evitar fumaça de cigarro (tabagismo ativo/passivo)",
        "Evitar ar frio e exercício intenso sem preparo",
        "Vacinação anual contra influenza",
        "Técnica inalatória correta (essencial!)"
      ],
      medications: [
        {
          class: "Corticoide inalatório (CI) - CONTROLADOR",
          examples: ["Budesonida 200-800mcg/dia", "Beclometasona 200-1000mcg/dia"],
          line: "1ª linha - manutenção"
        },
        {
          class: "CI + LABA (beta-2 de longa duração)",
          examples: ["Formoterol + Budesonida 6/200mcg 2x/dia", "Salmeterol + Fluticasona 50/250mcg 2x/dia"],
          line: "2ª linha (asma não controlada)"
        },
        {
          class: "Beta-2 agonista de curta duração (RESGATE)",
          examples: ["Salbutamol 100-200mcg (até 4-6x/dia se necessário)"],
          line: "Resgate de sintomas agudos"
        },
        {
          class: "Antileucotrienos",
          examples: ["Montelucaste 10mg/dia VO"],
          line: "Adjuvante (asma + rinite alérgica)"
        }
      ]
    },
    followup: {
      frequency: "A cada 1-3 meses até controle, depois 3-6 meses",
      monitoring: ["Sintomas diários/noturnos", "Uso de resgate", "Pico de fluxo (diário se instável)", "Espirometria anual", "Técnica inalatória"]
    }
  },
  pneumonia: {
    name: "Pneumonia Adquirida na Comunidade (PAC)",
    description: "Infecção aguda do parênquima pulmonar adquirida fora do ambiente hospitalar.",
    diagnosis: {
      criteria: "Sintomas respiratórios (tosse, febre, dispneia) + infiltrado novo no Raio-X de tórax",
      exams: [
        "Raio-X de tórax (PA + perfil)",
        "Hemograma completo",
        "PCR e VHS",
        "Ureia e creatinina",
        "Oximetria de pulso / Gasometria (se grave)",
        "Hemocultura (se internação)",
        "Pesquisa de antígenos urinários (pneumococo, Legionella)"
      ]
    },
    treatment: {
      lifestyle: [
        "Repouso relativo",
        "Hidratação oral adequada (2-3L/dia)",
        "Dieta leve e fracionada",
        "Evitar tabagismo",
        "Fisioterapia respiratória (se secreção abundante)"
      ],
      medications: [
        {
          class: "Amoxicilina + Clavulanato (ambulatorial leve)",
          examples: ["Amoxicilina + Clavulanato 875/125mg 12/12h por 5-7 dias"],
          line: "1ª linha - ambulatorial"
        },
        {
          class: "Macrolídeos (se atípicos)",
          examples: ["Azitromicina 500mg/dia por 3-5 dias", "Claritromicina 500mg 12/12h por 7 dias"],
          line: "1ª linha (associação)"
        },
        {
          class: "Fluoroquinolona respiratória (grave ou comorbidades)",
          examples: ["Levofloxacino 750mg/dia por 5 dias"],
          line: "Alternativa"
        },
        {
          class: "Sintomáticos",
          examples: ["Dipirona 500mg se febre >38°C", "Analgésicos para dor torácica"],
          line: "Suporte"
        }
      ]
    },
    followup: {
      frequency: "Reavaliação em 48-72h (ambulatorial), RX de controle em 4-6 semanas",
      monitoring: ["Temperatura", "Saturação O2", "Frequência respiratória", "Melhora clínica", "RX de tórax (4-6 semanas)"]
    }
  }
};

router.get("/protocols/:condition", (req, res) => {
  const condition = req.params.condition.toLowerCase().trim();
  
  const protocol = protocolsDatabase[condition];
  
  if (!protocol) {
    return res.status(404).json({
      error: "Protocolo não encontrado",
      message: `Não há protocolo cadastrado para "${condition}". Condições disponíveis: ${Object.keys(protocolsDatabase).join(', ')}`,
      available: Object.keys(protocolsDatabase)
    });
  }
  
  res.status(200).json({
    success: true,
    protocol: protocol,
    timestamp: new Date().toISOString()
  });
});

export default router;
