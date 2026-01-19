import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Users,
  Mail,
  Download,
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  Edit2,
  Image,
  Copy,
  MessageSquare,
  Settings,
  MapPin,
  Gift,
  Calendar,
  Lock,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FRONTEND_URL = window.location.origin;

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [isEditGuestOpen, setIsEditGuestOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [importingCSV, setImportingCSV] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState({ name: "", message: "" });
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [checkingPassword, setCheckingPassword] = useState(false);

  const [newGuest, setNewGuest] = useState({
    name: "",
    email: "",
    notes: "",
    max_guests: 1,
  });

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  useEffect(() => {
    if (event && !event.has_password) {
      setIsAuthenticated(true);
    } else if (event && event.has_password) {
      // Check if already authenticated in session
      const authKey = `event_auth_${eventId}`;
      if (sessionStorage.getItem(authKey) === "true") {
        setIsAuthenticated(true);
      }
    }
  }, [event, eventId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGuests();
    }
  }, [eventId, filter, isAuthenticated]);

  const fetchEventData = async () => {
    try {
      const [eventRes, statsRes] = await Promise.all([
        axios.get(`${API}/events/${eventId}`),
        axios.get(`${API}/events/${eventId}/stats`),
      ]);
      setEvent(eventRes.data);
      setEditEvent(eventRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Error al cargar el evento");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchGuests = async () => {
    try {
      const response = await axios.get(`${API}/events/${eventId}/guests`, {
        params: { status: filter !== "all" ? filter : undefined },
      });
      setGuests(response.data);
    } catch (error) {
      toast.error("Error al cargar los invitados");
    }
  };

  const refreshStats = async () => {
    try {
      const statsRes = await axios.get(`${API}/events/${eventId}/stats`);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to refresh stats");
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    if (!editEvent.name.trim()) {
      toast.error("El nombre del evento es requerido");
      return;
    }
    try {
      await axios.put(`${API}/events/${eventId}`, {
        name: editEvent.name,
        description: editEvent.description,
        event_date: editEvent.event_date,
        event_time: editEvent.event_time,
        location_title: editEvent.location_title,
        location_subtitle: editEvent.location_subtitle,
        registry_title: editEvent.registry_title,
        registry_url: editEvent.registry_url,
        password: editEvent.password,
      });
      toast.success("Evento actualizado");
      setIsEditEventOpen(false);
      fetchEventData();
    } catch (error) {
      toast.error("Error al actualizar el evento");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setCheckingPassword(true);
    try {
      await axios.post(`${API}/events/${eventId}/verify-password`, {
        password: passwordInput,
      });
      setIsAuthenticated(true);
      sessionStorage.setItem(`event_auth_${eventId}`, "true");
      toast.success("Acceso concedido");
    } catch (error) {
      toast.error("Contraseña incorrecta");
    } finally {
      setCheckingPassword(false);
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newGuest.name.trim() || !newGuest.email.trim()) {
      toast.error("Nombre y email son requeridos");
      return;
    }
    try {
      await axios.post(`${API}/events/${eventId}/guests`, newGuest);
      toast.success("Invitado agregado exitosamente");
      setIsAddGuestOpen(false);
      setNewGuest({ name: "", email: "", notes: "", max_guests: 1 });
      fetchGuests();
      refreshStats();
    } catch (error) {
      toast.error("Error al agregar invitado");
    }
  };

  const handleEditGuest = async (e) => {
    e.preventDefault();
    if (!editingGuest) return;
    try {
      await axios.put(`${API}/events/${eventId}/guests/${editingGuest.id}`, {
        name: editingGuest.name,
        email: editingGuest.email,
        notes: editingGuest.notes,
      });
      toast.success("Invitado actualizado");
      setIsEditGuestOpen(false);
      setEditingGuest(null);
      fetchGuests();
    } catch (error) {
      toast.error("Error al actualizar invitado");
    }
  };

  const handleDeleteGuest = async () => {
    if (!guestToDelete) return;
    try {
      await axios.delete(`${API}/events/${eventId}/guests/${guestToDelete.id}`);
      toast.success("Invitado eliminado");
      fetchGuests();
      refreshStats();
    } catch (error) {
      toast.error("Error al eliminar invitado");
    } finally {
      setDeleteDialogOpen(false);
      setGuestToDelete(null);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor sube una imagen");
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${API}/events/${eventId}/invitation`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setEvent({ ...event, invitation_image: response.data.invitation_image });
      toast.success("Invitación subida exitosamente");
    } catch (error) {
      toast.error("Error al subir la invitación");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteInvitation = async () => {
    try {
      await axios.delete(`${API}/events/${eventId}/invitation`);
      setEvent({ ...event, invitation_image: null });
      toast.success("Invitación eliminada");
    } catch (error) {
      toast.error("Error al eliminar la invitación");
    }
  };

  const handleSendEmails = async () => {
    if (selectedGuests.length === 0) {
      toast.error("Selecciona invitados para enviar la invitación");
      return;
    }
    setSendingEmails(true);
    try {
      await axios.post(`${API}/events/${eventId}/send-invitations`, {
        guest_ids: selectedGuests,
      });
      toast.success(`Enviando invitaciones a ${selectedGuests.length} invitado(s)`);
      setSelectedGuests([]);
    } catch (error) {
      toast.error("Error al enviar invitaciones");
    } finally {
      setSendingEmails(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API}/events/${eventId}/export-csv`, {
        params: { status: filter !== "all" ? filter : undefined },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invitados_${eventId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV exportado exitosamente");
    } catch (error) {
      toast.error("Error al exportar CSV");
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Por favor selecciona un archivo CSV");
      return;
    }

    setImportingCSV(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${API}/events/${eventId}/guests/import-csv`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      
      const { imported, errors } = response.data;
      
      if (imported > 0) {
        toast.success(`${imported} invitado(s) importados exitosamente`);
        fetchGuests();
        refreshStats();
      }
      
      if (errors && errors.length > 0) {
        errors.slice(0, 3).forEach(err => toast.error(err));
        if (errors.length > 3) {
          toast.error(`... y ${errors.length - 3} errores más`);
        }
      }
    } catch (error) {
      toast.error("Error al importar CSV");
    } finally {
      setImportingCSV(false);
      // Reset input
      if (csvInputRef.current) {
        csvInputRef.current.value = "";
      }
    }
  };

  const copyRSVPLink = async (guest) => {
    const link = `${FRONTEND_URL}/rsvp/${guest.rsvp_token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado al portapapeles");
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success("Link copiado al portapapeles");
      } catch (e) {
        toast.info(`Link RSVP: ${link}`);
      }
      document.body.removeChild(textArea);
    }
  };

  const toggleSelectAll = () => {
    if (selectedGuests.length === guests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(guests.map((g) => g.id));
    }
  };

  const toggleSelectGuest = (guestId) => {
    setSelectedGuests((prev) =>
      prev.includes(guestId) ? prev.filter((id) => id !== guestId) : [...prev, guestId]
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return <span className="badge-confirmed">Confirmado</span>;
      case "declined":
        return <span className="badge-declined">No asiste</span>;
      default:
        return <span className="badge-pending">Pendiente</span>;
    }
  };

  const showMessage = (guest) => {
    setSelectedMessage({ name: guest.name, message: guest.message });
    setMessageDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!event) return null;

  // Password protection screen
  if (event.has_password && !isAuthenticated) {
    return (
      <div className="min-h-screen relative z-10 flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base max-w-md w-full mx-4"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
              <Lock className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-2xl mb-2">{event.name}</h2>
            <p className="text-muted-foreground text-sm">Este evento está protegido con contraseña</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-password">Contraseña</Label>
              <Input
                id="event-password"
                type="password"
                data-testid="event-password-input"
                placeholder="Ingresa la contraseña"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="h-12"
                autoFocus
              />
            </div>
            <Button 
              type="submit" 
              className="w-full btn-primary" 
              disabled={checkingPassword || !passwordInput}
              data-testid="submit-password-btn"
            >
              {checkingPassword ? "Verificando..." : "Acceder"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => navigate("/")} className="text-muted-foreground">
              Volver a eventos
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4 -ml-2"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Todos los Eventos
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-medium tracking-tight">
                {event.name}
              </h1>
              {event.description && (
                <p className="text-muted-foreground mt-2 max-w-2xl">{event.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                {event.event_date && <span>{new Date(event.event_date).toLocaleDateString('es-MX')}</span>}
                {event.event_time && <span>• {event.event_time}</span>}
                {event.location_title && <span>• {event.location_title}</span>}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsEditEventOpen(true)}
              data-testid="edit-event-btn"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" strokeWidth={1.5} />
              Editar Evento
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="card-base">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/5 rounded-sm flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-display font-medium">{stats.total_guests || 0}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
              </div>
            </div>
          </div>
          <div className="card-base">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#4A5D23]/10 rounded-sm flex items-center justify-center">
                <Check className="w-5 h-5 text-[#4A5D23]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-display font-medium">{stats.confirmed || 0}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Confirmados</p>
              </div>
            </div>
          </div>
          <div className="card-base">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D4A373]/20 rounded-sm flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#8B6914]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-display font-medium">{stats.pending || 0}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pendientes</p>
              </div>
            </div>
          </div>
          <div className="card-base">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-sm flex items-center justify-center">
                <X className="w-5 h-5 text-destructive" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-display font-medium">{stats.declined || 0}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">No asisten</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invitation Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-base lg:col-span-1"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl">Diseño de Invitación</h2>
              {event.invitation_image && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteInvitation}
                  className="text-muted-foreground hover:text-destructive"
                  data-testid="delete-invitation-btn"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              )}
            </div>

            {/* Invitation Image */}
            {event.invitation_image ? (
              <div className="relative w-full mb-4" style={{ maxWidth: '6628px' }}>
                <img
                  src={event.invitation_image}
                  alt="Invitación"
                  className="w-full h-auto object-contain rounded-sm"
                  style={{ maxHeight: '600px' }}
                  data-testid="invitation-preview"
                />
              </div>
            ) : (
              <div
                className="w-full bg-muted/50 border-2 border-dashed border-border rounded-sm flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors mb-4"
                style={{ aspectRatio: '6628/4649', maxHeight: '400px' }}
                onClick={() => fileInputRef.current?.click()}
                data-testid="upload-invitation-area"
              >
                <Image className="w-12 h-12 text-muted-foreground mb-3" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">Haz clic para subir invitación</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Recomendado: 6628 x 4649 px</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              data-testid="invitation-file-input"
            />

            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              data-testid="upload-invitation-btn"
            >
              <Upload className="w-4 h-4 mr-2" strokeWidth={1.5} />
              {uploadingImage ? "Subiendo..." : event.invitation_image ? "Cambiar Imagen" : "Subir Invitación"}
            </Button>
          </motion.div>

          {/* Guest List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-base lg:col-span-2"
          >
            {/* Guest List Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-display text-xl">Lista de Invitados</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="filter-select">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="confirmed">Confirmados</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="declined">No asisten</SelectItem>
                  </SelectContent>
                </Select>

                <Dialog open={isAddGuestOpen} onOpenChange={setIsAddGuestOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" data-testid="add-guest-btn">
                      <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      Agregar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-display text-2xl">Agregar Invitado</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddGuest} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="guest-name">Nombre *</Label>
                        <Input
                          id="guest-name"
                          data-testid="guest-name-input"
                          placeholder="María García"
                          value={newGuest.name}
                          onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guest-email">Email *</Label>
                        <Input
                          id="guest-email"
                          type="email"
                          data-testid="guest-email-input"
                          placeholder="maria@ejemplo.com"
                          value={newGuest.email}
                          onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guest-max">Máximo de Invitados</Label>
                        <Input
                          id="guest-max"
                          type="number"
                          min="1"
                          max="20"
                          data-testid="guest-max-input"
                          placeholder="1"
                          value={newGuest.max_guests}
                          onChange={(e) => setNewGuest({ ...newGuest, max_guests: parseInt(e.target.value) || 1 })}
                        />
                        <p className="text-xs text-muted-foreground">Número máximo de personas que puede traer</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guest-notes">Notas</Label>
                        <Textarea
                          id="guest-notes"
                          data-testid="guest-notes-input"
                          placeholder="Notas adicionales..."
                          value={newGuest.notes}
                          onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                        />
                      </div>
                      <Button type="submit" className="w-full btn-primary" data-testid="submit-add-guest">
                        Agregar Invitado
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                  data-testid="csv-file-input"
                />
                
                <Button 
                  variant="outline" 
                  onClick={() => csvInputRef.current?.click()}
                  disabled={importingCSV}
                  data-testid="import-csv-btn"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  {importingCSV ? "Importando..." : "Importar CSV"}
                </Button>
              </div>
            </div>

            {/* Action Bar */}
            {guests.length > 0 && (
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                <Checkbox
                  checked={selectedGuests.length === guests.length && guests.length > 0}
                  onCheckedChange={toggleSelectAll}
                  data-testid="select-all-checkbox"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedGuests.length > 0
                    ? `${selectedGuests.length} seleccionados`
                    : "Seleccionar todos"}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendEmails}
                    disabled={selectedGuests.length === 0 || sendingEmails}
                    data-testid="send-emails-btn"
                  >
                    <Mail className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    {sendingEmails ? "Enviando..." : "Enviar Email"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    data-testid="export-csv-btn"
                  >
                    <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Exportar CSV
                  </Button>
                </div>
              </div>
            )}

            {/* Guest Table */}
            {guests.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1} />
                <p className="text-muted-foreground">Aún no hay invitados</p>
                <Button
                  variant="link"
                  onClick={() => setIsAddGuestOpen(true)}
                  className="mt-2"
                >
                  Agregar tu primer invitado
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="clean-table">
                  <thead>
                    <tr>
                      <th className="w-10"></th>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Estado</th>
                      <th>Máx</th>
                      <th>Confirmados</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map((guest) => (
                      <tr key={guest.id} data-testid={`guest-row-${guest.id}`}>
                        <td>
                          <Checkbox
                            checked={selectedGuests.includes(guest.id)}
                            onCheckedChange={() => toggleSelectGuest(guest.id)}
                            data-testid={`select-guest-${guest.id}`}
                          />
                        </td>
                        <td>
                          <div>
                            <p className="font-medium">{guest.name}</p>
                            {guest.notes && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {guest.notes}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="text-muted-foreground">{guest.email}</td>
                        <td>{getStatusBadge(guest.rsvp_status)}</td>
                        <td className="text-center">{guest.max_guests || 1}</td>
                        <td className="text-center">
                          {guest.rsvp_status === "confirmed" ? guest.guest_count : "-"}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            {guest.message && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => showMessage(guest)}
                                      className="text-[#4A5D23]"
                                      data-testid={`view-message-${guest.id}`}
                                    >
                                      <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver mensaje</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyRSVPLink(guest)}
                              title="Copiar link RSVP"
                              data-testid={`copy-link-${guest.id}`}
                            >
                              <Copy className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingGuest(guest);
                                setIsEditGuestOpen(true);
                              }}
                              title="Editar invitado"
                              data-testid={`edit-guest-${guest.id}`}
                            >
                              <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setGuestToDelete(guest);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-muted-foreground hover:text-destructive"
                              title="Eliminar invitado"
                              data-testid={`delete-guest-${guest.id}`}
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Edit Guest Dialog */}
      <Dialog open={isEditGuestOpen} onOpenChange={setIsEditGuestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Editar Invitado</DialogTitle>
          </DialogHeader>
          {editingGuest && (
            <form onSubmit={handleEditGuest} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-guest-name">Nombre *</Label>
                <Input
                  id="edit-guest-name"
                  data-testid="edit-guest-name-input"
                  value={editingGuest.name}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-guest-email">Email *</Label>
                <Input
                  id="edit-guest-email"
                  type="email"
                  data-testid="edit-guest-email-input"
                  value={editingGuest.email}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-guest-notes">Notas</Label>
                <Textarea
                  id="edit-guest-notes"
                  data-testid="edit-guest-notes-input"
                  value={editingGuest.notes || ""}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, notes: e.target.value })
                  }
                />
              </div>
              <Button type="submit" className="w-full btn-primary" data-testid="submit-edit-guest">
                Guardar Cambios
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Guest Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Invitado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar a {guestToDelete?.name} de la lista de invitados?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGuest}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Mensaje de {selectedMessage.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 p-4 bg-muted/50 rounded-sm">
            <p className="text-foreground italic">"{selectedMessage.message}"</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Editar Evento</DialogTitle>
          </DialogHeader>
          {editEvent && (
            <form onSubmit={handleEditEvent} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-event-name">Nombre del Evento *</Label>
                <Input
                  id="edit-event-name"
                  data-testid="edit-event-name-input"
                  value={editEvent.name || ""}
                  onChange={(e) => setEditEvent({ ...editEvent, name: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-event-description">Descripción</Label>
                <Textarea
                  id="edit-event-description"
                  data-testid="edit-event-description-input"
                  value={editEvent.description || ""}
                  onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-event-date">Fecha</Label>
                  <Input
                    id="edit-event-date"
                    type="date"
                    value={editEvent.event_date || ""}
                    onChange={(e) => setEditEvent({ ...editEvent, event_date: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-event-time">Hora</Label>
                  <Input
                    id="edit-event-time"
                    type="time"
                    value={editEvent.event_time || ""}
                    onChange={(e) => setEditEvent({ ...editEvent, event_time: e.target.value })}
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
                  <Label htmlFor="edit-location-title">Nombre del lugar</Label>
                  <Input
                    id="edit-location-title"
                    value={editEvent.location_title || ""}
                    onChange={(e) => setEditEvent({ ...editEvent, location_title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location-subtitle">Dirección o detalles</Label>
                  <Input
                    id="edit-location-subtitle"
                    value={editEvent.location_subtitle || ""}
                    onChange={(e) => setEditEvent({ ...editEvent, location_subtitle: e.target.value })}
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
                  <Label htmlFor="edit-registry-title">Título</Label>
                  <Input
                    id="edit-registry-title"
                    value={editEvent.registry_title || ""}
                    onChange={(e) => setEditEvent({ ...editEvent, registry_title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-registry-url">Link de la mesa de regalos</Label>
                  <Input
                    id="edit-registry-url"
                    value={editEvent.registry_url || ""}
                    onChange={(e) => setEditEvent({ ...editEvent, registry_url: e.target.value })}
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-sm">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="w-4 h-4" strokeWidth={1.5} />
                  Protección del Evento
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">Nueva Contraseña</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    placeholder="Dejar vacío para mantener actual o quitar"
                    value={editEvent.password || ""}
                    onChange={(e) => setEditEvent({ ...editEvent, password: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Deja vacío para quitar la contraseña</p>
                </div>
              </div>

              <Button type="submit" className="w-full btn-primary" data-testid="submit-edit-event">
                Guardar Cambios
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
