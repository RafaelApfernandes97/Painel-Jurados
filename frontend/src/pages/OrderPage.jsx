import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { choreographiesApi, eventsApi } from "../api/client";

import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";

export default function OrderPage() {
  const { eventId } = useParams();
  const sensors = useSensors(useSensor(PointerSensor));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventItem, setEventItem] = useState(null);
  const [items, setItems] = useState([]);
  const [baseline, setBaseline] = useState([]);

  useEffect(() => {
    loadData();
  }, [eventId]);

  async function loadData() {
    setLoading(true);

    try {
      const [events, choreographies] = await Promise.all([eventsApi.list(), choreographiesApi.list(eventId)]);
      const sorted = choreographies.slice().sort((left, right) => left.ordem_apresentacao - right.ordem_apresentacao);
      setEventItem(events.find((event) => event._id === eventId) || null);
      setItems(sorted);
      setBaseline(sorted.map((item) => item._id));
    } finally {
      setLoading(false);
    }
  }

  const dirty = useMemo(
    () => JSON.stringify(items.map((item) => item._id)) !== JSON.stringify(baseline),
    [baseline, items]
  );

  async function persistOrder(nextItems) {
    setSaving(true);

    try {
      await Promise.all(
        nextItems.map((item, index) =>
          choreographiesApi.update(item._id, {
            ordem_apresentacao: index + 1
          })
        )
      );

      setBaseline(nextItems.map((item) => item._id));
    } finally {
      setSaving(false);
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setItems((current) => {
      const oldIndex = current.findIndex((item) => item._id === active.id);
      const newIndex = current.findIndex((item) => item._id === over.id);

      const nextItems = arrayMove(current, oldIndex, newIndex).map((item, index) => ({
        ...item,
        ordem_apresentacao: index + 1
      }));

      persistOrder(nextItems);
      return nextItems;
    });
  }

  async function handleSaveOrder() {
    await persistOrder(items);
  }

  if (loading) {
    return <LoadingState label="Carregando ordem de apresentacao..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evento"
        title={eventItem ? `${eventItem.nome} - Ordem de apresentacao` : "Ordem de apresentacao"}
        description="Arraste para reorganizar a fila. O campo ordem_apresentacao e atualizado no backend."
        actions={
          <button type="button" className="btn-primary" onClick={handleSaveOrder} disabled={!dirty || saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar ordem"}
          </button>
        }
      />



      {items.length ? (
        <Card>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((item) => item._id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <SortableRow key={item._id} item={item} index={index} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </Card>
      ) : (
        <EmptyState
          title="Nenhuma coreografia disponivel"
          description="Cadastre coreografias antes de organizar a ordem de apresentacao."
        />
      )}
    </div>
  );
}

function SortableRow({ item, index }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4"
    >
      <button
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <p className="font-bold text-slate-900">
          {index + 1}. {item.nome_coreografia}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          #{item.n_inscricao} - {item.escola}
        </p>
      </div>
    </div>
  );
}
