import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ConsultorioLayout from '@/components/ConsultorioLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, User, Clock, Bell, Save } from 'lucide-react';

interface DoctorSettings {
  duracaoPadrao: number;
  aceita: {
    manha: boolean;
    tarde: boolean;
    noite: boolean;
  };
  notificacoes: {
    emailMarketplace: boolean;
    emailConsultas: boolean;
  };
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<DoctorSettings>({
    duracaoPadrao: 50,
    aceita: {
      manha: true,
      tarde: true,
      noite: false,
    },
    notificacoes: {
      emailMarketplace: true,
      emailConsultas: true,
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('consultorio_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('consultorio_settings', JSON.stringify(settings));
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: 'Configurações salvas!',
        description: 'Suas preferências foram atualizadas com sucesso.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar suas configurações.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const ToggleSwitch = ({ 
    checked, 
    onChange, 
    label,
    testId 
  }: { 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
    label: string;
    testId: string;
  }) => (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
        data-testid={testId}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );

  return (
    <ConsultorioLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-teal-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Configurações
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Personalize suas preferências de atendimento
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-teal-600" />
              Perfil Profissional
            </CardTitle>
            <CardDescription>
              Informações do seu cadastro médico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
                <p className="font-medium">{user?.fullName || 'Nome do Médico'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">E-mail</p>
                <p className="font-medium">{user?.email || 'medico@email.com'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">CRM</p>
                <p className="font-medium">123456-SP</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Especialidades</p>
                <p className="font-medium">Psiquiatria, Clínica Geral</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Para alterar seus dados profissionais, entre em contato com o suporte.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" />
              Preferências de Consulta
            </CardTitle>
            <CardDescription>
              Configure como você prefere atender
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Duração padrão da consulta (minutos)
              </label>
              <Input
                type="number"
                value={settings.duracaoPadrao}
                onChange={(e) => setSettings({ ...settings, duracaoPadrao: parseInt(e.target.value) || 50 })}
                className="max-w-[200px]"
                min={15}
                max={120}
                step={5}
                data-testid="input-duracao"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Aceito consultas nos períodos:
              </p>
              <div className="space-y-3">
                <ToggleSwitch
                  checked={settings.aceita.manha}
                  onChange={(checked) => setSettings({ 
                    ...settings, 
                    aceita: { ...settings.aceita, manha: checked } 
                  })}
                  label="Manhã (06h - 12h)"
                  testId="toggle-manha"
                />
                <ToggleSwitch
                  checked={settings.aceita.tarde}
                  onChange={(checked) => setSettings({ 
                    ...settings, 
                    aceita: { ...settings.aceita, tarde: checked } 
                  })}
                  label="Tarde (12h - 18h)"
                  testId="toggle-tarde"
                />
                <ToggleSwitch
                  checked={settings.aceita.noite}
                  onChange={(checked) => setSettings({ 
                    ...settings, 
                    aceita: { ...settings.aceita, noite: checked } 
                  })}
                  label="Noite (18h - 22h)"
                  testId="toggle-noite"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-teal-600" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como deseja ser notificado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ToggleSwitch
              checked={settings.notificacoes.emailMarketplace}
              onChange={(checked) => setSettings({ 
                ...settings, 
                notificacoes: { ...settings.notificacoes, emailMarketplace: checked } 
              })}
              label="Receber e-mails quando houver novas consultas no Marketplace"
              testId="toggle-email-marketplace"
            />
            <ToggleSwitch
              checked={settings.notificacoes.emailConsultas}
              onChange={(checked) => setSettings({ 
                ...settings, 
                notificacoes: { ...settings.notificacoes, emailConsultas: checked } 
              })}
              label="Receber e-mails sobre minhas consultas agendadas"
              testId="toggle-email-consultas"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-teal-600 hover:bg-teal-700"
            data-testid="button-save-settings"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </ConsultorioLayout>
  );
}
