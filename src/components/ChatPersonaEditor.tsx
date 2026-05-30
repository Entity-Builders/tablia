import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Mic2, Save } from 'lucide-react';
import type { ChatPersona, ChatPersonaId } from '../types';
import {
  CHAT_PERSONAS,
  getChatPersonaOption,
  normalizeChatPersona,
} from '../services/chat-persona';
import './ChatPersonaEditor.css';

interface ChatPersonaEditorProps {
  venueId: string;
  initialPersona?: ChatPersona;
  onSaved?: (persona: ChatPersona) => void;
}

const PREVIEW_BY_PERSONA: Record<ChatPersonaId, string> = {
  curator:
    'Para compartir iría por la tabla de quesos y fiambres, y si quieren algo más fuerte sumaría el vacío. Es una combinación equilibrada y fácil de repartir.',
  friendly:
    'Para compartir, la tabla de quesos y fiambres va muy bien como arranque. Si vienen con hambre, sumaría el vacío y dejan el postre para el final.',
  sommelier:
    'La tabla de quesos y fiambres abre bien porque mezcla sal, grasa y acidez. Después, el vacío aporta intensidad de parrilla sin tapar los sabores.',
  concise:
    'Para compartir: tabla de quesos y fiambres. Si quieren algo más contundente, sumen vacío a la parrilla.',
  premium:
    'Para compartir, elegiría la tabla de quesos y fiambres como inicio y el vacío como principal. Es una secuencia sobria, generosa y bien balanceada.',
};

export function ChatPersonaEditor({
  venueId,
  initialPersona,
  onSaved,
}: ChatPersonaEditorProps) {
  const normalizedInitial = useMemo(
    () => normalizeChatPersona(initialPersona),
    [initialPersona?.id],
  );
  const [selectedId, setSelectedId] = useState<ChatPersonaId>(
    normalizedInitial.id,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const next = normalizeChatPersona(initialPersona);
    setSelectedId(next.id);
  }, [initialPersona?.id]);

  const selectedOption = getChatPersonaOption({ id: selectedId });
  const dirty = selectedId !== normalizedInitial.id;

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setSaved(false);

    try {
      const { updateVenueChatPersona } = await import(
        '../services/venue-service'
      );
      const nextPersona = await updateVenueChatPersona(venueId, {
        id: selectedId,
      });
      onSaved?.(nextPersona);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Error al guardar el locutor',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='chat-persona-editor'>
      <div className='chat-persona-editor__header'>
        <h3>
          <Mic2 size={18} />
          Locutor del chat
        </h3>
      </div>

      <div
        className='chat-persona-editor__options'
        role='radiogroup'
        aria-label='Locutor del chat'
      >
        {CHAT_PERSONAS.map((persona) => (
          <label
            key={persona.id}
            className={`chat-persona-editor__option ${
              selectedId === persona.id
                ? 'chat-persona-editor__option--active'
                : ''
            }`}
          >
            <input
              type='radio'
              name='chat-persona'
              value={persona.id}
              checked={selectedId === persona.id}
              onChange={() => {
                setSelectedId(persona.id);
                setSaved(false);
              }}
            />
            <span className='chat-persona-editor__option-text'>
              <strong>{persona.label}</strong>
              <span>{persona.description}</span>
            </span>
          </label>
        ))}
      </div>

      <div className='chat-persona-editor__preview'>
        <span>{selectedOption.label}</span>
        <p>{PREVIEW_BY_PERSONA[selectedOption.id]}</p>
      </div>

      <div className='chat-persona-editor__save-bar'>
        {saved && (
          <span className='chat-persona-editor__saved'>
            <Check size={14} />
            Guardado
          </span>
        )}
        <button
          className='chat-persona-editor__save'
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? (
            <>
              <Loader2 size={14} className='menu-import__spin' />
              Guardando...
            </>
          ) : (
            <>
              <Save size={14} />
              Guardar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
