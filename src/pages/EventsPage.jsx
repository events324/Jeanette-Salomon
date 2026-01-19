import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Calendar, MapPin, Users, ChevronRight, Trash2, Clock, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    event_date: "",
    event_time: "",
    location_title: "",
    location_subtitle: "",
    registry_title: "",
    registry_url: "",
  });
  const [eventStats, setEventStats] = useState({});

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
      response.data.forEach(async (event) => {
        try {
          const statsRes = await axios.get(`${API}/events/${event.id}/stats`);
          setEventStats(prev => ({ ...prev, [event.id]: statsRes.data }));
        } catch (e) {
          console.error("Error fetching stats for event", event.id);
        }
      });
    } catch (error) {
      toast.error("Error al cargar los eventos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.name.trim()) {
      toast.error("El nombre del evento es requerido");
      return;
    }
    try {
      await axios.post(`${API}/events`, newEvent);
      toast.success("Evento creado exitosamente");
      setIsCreateOpen(false);
      setNewEvent({ 
        name: "", 
        description: "", 
        event_date: "", 
        event_time: "", 
        location_title: "",
        location_subtitle: "",
        registry_title: "",
        registry_url: "",
      });
      fetchEvents();
    } catch (error) {
      toast.error("Error al crear el evento");
    }
  };

  const handleDeleteClick = (e, event) => {
    e.stopPropagation();
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    try {
      await axios.delete(`${API}/events/${eventToDelete.id}`);
      toast.success("Evento eliminado exitosamente");
      fetchEvents();
    } catch (error) {
      toast.error("Error al eliminar el evento");
    } finally {
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Fecha por confirmar";
    try {
      return new Date(dateStr).toLocaleDateString("es-MX", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return null;
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-foreground">
              Eventos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Panel de Eventos creado por Emily Hajar</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button 
                data-testid="create-event-btn"
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} />
                Nuevo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Crear Nuevo Evento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Evento *</Label>
                  <Input
                    id="name"
                    data-testid="event-name-input"
                    placeholder="Boda de María y Juan"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    data-testid="event-description-input"
                    placeholder="Acompáñanos a celebrar este día tan especial..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input
                      id="date"
                      data-testid="event-date-input"
                      type="date"
                      value={newEvent.event_date}
                      onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora</Label>
                    <Input
                      id="time"
                      data-testid="event-time-input"
                      type="time"
                      value={newEvent.event_time}
                      onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                      className="h-12"
                    />
                  </div>
                </div>
                
                {/* Location Section */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-sm">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="w-4 h-4" strokeWidth={1.5} />
                    Ubicación
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location_title">Nombre del lugar</Label>
                    <Input
                      id="location_title"
                      data-testid="event-location-title-input"
                      placeholder="Hotel Grand"
                      value={newEvent.location_title}
                      onChange={(e) => setNewEvent({ ...newEvent, location_title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location_subtitle">Dirección o detalles</Label>
                    <Input
                      id="location_subtitle"
                      data-testid="event-location-subtitle-input"
                      placeholder="Av. Reforma 123, Salón Principal"
                      value={newEvent.location_subtitle}
                      onChange={(e) => setNewEvent({ ...newEvent, location_subtitle: e.target.value })}
                    />
                  </div>
                </div>

                {/* Registry Section */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-sm">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Gift className="w-4 h-4" strokeWidth={1.5} />
                    Mesa de Regalos
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registry_title">Título</Label>
                    <Input
                      id="registry_title"
                      data-testid="event-registry-title-input"
                      placeholder="Liverpool, Amazon"
                      value={newEvent.registry_title}
                      onChange={(e) => setNewEvent({ ...newEvent, registry_title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registry_url">Link de la mesa de regalos</Label>
                    <Input
                      id="registry_url"
                      data-testid="event-registry-url-input"
                      placeholder="https://www.liverpool.com.mx/mesa/..."
                      value={newEvent.registry_url}
                      onChange={(e) => setNewEvent({ ...newEvent, registry_url: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" data-testid="submit-create-event" className="w-full btn-primary">
                  Crear Evento
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-pulse text-muted-foreground">Cargando eventos...</div>
          </div>
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 bg-muted rounded-sm mx-auto mb-6 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-muted-foreground" strokeWidth={1} />
            </div>
            <h2 className="font-display text-2xl mb-2">Aún no hay eventos</h2>
            <p className="text-muted-foreground mb-8">Crea tu primer evento digital para comenzar</p>
            <Button onClick={() => setIsCreateOpen(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Crear Tu Primer Evento
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => {
              const stats = eventStats[event.id] || {};
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/events/${event.id}`)}
                  data-testid={`event-card-${event.id}`}
                  className="card-base card-interactive group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-xl font-medium truncate group-hover:text-primary transition-colors">
                        {event.name}
                      </h3>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`delete-event-${event.id}`}
                      onClick={(e) => handleDeleteClick(e, event)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </Button>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" strokeWidth={1.5} />
                      <span>{formatDate(event.event_date)}</span>
                    </div>
                    {event.event_time && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" strokeWidth={1.5} />
                        <span>{formatTime(event.event_time)}</span>
                      </div>
                    )}
                    {event.location_title && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" strokeWidth={1.5} />
                        <span>{event.location_title}</span>
                      </div>
                    )}
                    {event.registry_title && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Gift className="w-4 h-4" strokeWidth={1.5} />
                        <span>{event.registry_title}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        
                      </div>
                      {stats.confirmed > 0 && (
                        <span className="badge-confirmed"></span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Evento</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar "{eventToDelete?.name}"? Esto también eliminará todos los invitados y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
