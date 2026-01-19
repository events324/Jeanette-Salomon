import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, Check, X, Minus, Plus, PartyPopper, Clock, Gift, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RSVPPage() {
  const { token } = useParams();
  const [rsvpData, setRsvpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [response, setResponse] = useState(null);
  const [guestCount, setGuestCount] = useState(1);
  const [maxGuests, setMaxGuests] = useState(1);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchRSVPData();
  }, [token]);

  const fetchRSVPData = async () => {
    try {
      const res = await axios.get(`${API}/rsvp/${token}`);
      setRsvpData(res.data);
      setMaxGuests(res.data.max_guests || 1);
      if (res.data.rsvp_status !== "pending") {
        setSubmitted(true);
        setResponse(res.data.rsvp_status === "confirmed" ? "yes" : "no");
        setGuestCount(res.data.guest_count || 1);
        setMessage(res.data.message || "");
      }
    } catch (error) {
      toast.error("Link de RSVP inválido o expirado");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!response) {
      toast.error("Por favor selecciona tu respuesta");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/rsvp/${token}`, {
        response: response,
        guest_count: response === "yes" ? guestCount : 0,
        message: message,
      });
      setSubmitted(true);
      toast.success("¡Gracias por tu respuesta!");
    } catch (error) {
      toast.error("Error al enviar RSVP");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
        <div className="animate-pulse text-muted-foreground">Cargando invitación...</div>
      </div>
    );
  }

  if (!rsvpData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] p-8">
        <div className="text-center">
          <h1 className="font-display text-3xl mb-4">Link Inválido</h1>
          <p className="text-muted-foreground">Este link de RSVP es inválido o ha expirado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7] py-8 px-4 md:py-16" data-testid="rsvp-page">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        {/* Main Card */}
        <div className="bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)] rounded-sm overflow-hidden">
          {/* Invitation Image */}
          {rsvpData.invitation_image && (
            <div className="relative w-full">
              <img
                src={rsvpData.invitation_image}
                alt="Invitación del Evento"
                className="w-full h-auto object-contain"
                style={{ maxHeight: '70vh' }}
                data-testid="rsvp-invitation-image"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8 md:p-12 lg:p-16">
            {/* Guest Name */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
                Estimado/a
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-medium" data-testid="rsvp-guest-name">
                {rsvpData.guest_name}
              </h2>
            </motion.div>

            {/* Event Details */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-10"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
                Estás cordialmente invitado/a a
              </p>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-6" data-testid="rsvp-event-name">
                {rsvpData.event_name}
              </h1>

              {rsvpData.event_description && (
                <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                  {rsvpData.event_description}
                </p>
              )}
            </motion.div>

            {/* Date, Time & Location */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-6 mb-8"
            >
              {rsvpData.event_date && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-muted rounded-sm flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Fecha</p>
                    <p className="font-medium" data-testid="rsvp-event-date">{formatDate(rsvpData.event_date)}</p>
                  </div>
                </div>
              )}

              {rsvpData.event_time && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-muted rounded-sm flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Hora</p>
                    <p className="font-medium" data-testid="rsvp-event-time">{formatTime(rsvpData.event_time)}</p>
                  </div>
                </div>
              )}

              {rsvpData.location_title && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-muted rounded-sm flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Lugar</p>
                    <p className="font-medium" data-testid="rsvp-event-location">{rsvpData.location_title}</p>
                    {rsvpData.location_subtitle && (
                      <p className="text-sm text-muted-foreground">{rsvpData.location_subtitle}</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Gift Registry */}
            {rsvpData.registry_url && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mb-12 p-6 bg-muted/30 rounded-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Gift className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Mesa de Regalos</p>
                    <p className="font-medium mb-3">{rsvpData.registry_title || "Ver mesa de regalos"}</p>
                    <a
                      href={rsvpData.registry_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      data-testid="registry-link"
                    >
                      <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                      Ir a la mesa de regalos
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="border-t border-border pt-12">
              {/* RSVP Form */}
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                  data-testid="rsvp-submitted"
                >
                  {response === "yes" ? (
                    <>
                      <div className="w-20 h-20 bg-[#4A5D23]/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <PartyPopper className="w-10 h-10 text-[#4A5D23]" strokeWidth={1.5} />
                      </div>
                      <h3 className="font-display text-2xl md:text-3xl mb-3">¡Nos vemos allá!</h3>
                      <p className="text-muted-foreground mb-6">
                        Tu asistencia ha sido confirmada para {guestCount} {guestCount === 1 ? "persona" : "personas"}.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-6 flex items-center justify-center">
                        <X className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <h3 className="font-display text-2xl md:text-3xl mb-3">¡Te extrañaremos!</h3>
                      <p className="text-muted-foreground mb-6">
                        Gracias por avisarnos. Esperamos verte en otra ocasión.
                      </p>
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false);
                      setResponse(null);
                      setGuestCount(1);
                      setMessage("");
                    }}
                    data-testid="change-rsvp-btn"
                    className="mt-4"
                  >
                    Cambiar mi respuesta
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
                    ¿Asistirás?
                  </p>

                  {/* Response Selection */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <button
                      onClick={() => setResponse("yes")}
                      data-testid="rsvp-yes-btn"
                      className={`flex-1 p-6 rounded-sm border-2 transition-all duration-300 ${
                        response === "yes"
                          ? "border-[#4A5D23] bg-[#4A5D23]/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            response === "yes" ? "bg-[#4A5D23] text-white" : "bg-muted"
                          }`}
                        >
                          <Check className="w-5 h-5" strokeWidth={1.5} />
                        </div>
                        <span className="font-display text-xl">Sí, asistiré</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setResponse("no")}
                      data-testid="rsvp-no-btn"
                      className={`flex-1 p-6 rounded-sm border-2 transition-all duration-300 ${
                        response === "no"
                          ? "border-destructive bg-destructive/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            response === "no" ? "bg-destructive text-white" : "bg-muted"
                          }`}
                        >
                          <X className="w-5 h-5" strokeWidth={1.5} />
                        </div>
                        <span className="font-display text-xl">No podré asistir</span>
                      </div>
                    </button>
                  </div>

                  {/* Guest Count & Message (only if attending) */}
                  {response === "yes" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-8 space-y-6"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
                          Número de asistentes (máximo {maxGuests})
                        </p>
                        <div className="flex items-center justify-center gap-4">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                            disabled={guestCount <= 1}
                            data-testid="decrease-guests-btn"
                            className="h-12 w-12 rounded-sm"
                          >
                            <Minus className="w-4 h-4" strokeWidth={1.5} />
                          </Button>
                          <span className="font-display text-4xl w-16 text-center" data-testid="guest-count">
                            {guestCount}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setGuestCount(Math.min(maxGuests, guestCount + 1))}
                            disabled={guestCount >= maxGuests}
                            data-testid="increase-guests-btn"
                            className="h-12 w-12 rounded-sm"
                          >
                            <Plus className="w-4 h-4" strokeWidth={1.5} />
                          </Button>
                        </div>
                        <p className="text-center text-sm text-muted-foreground mt-2">
                          Incluyéndote a ti
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Message field for both yes and no */}
                  {response && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-8"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                          Mensaje para los novios (opcional)
                        </Label>
                        <Textarea
                          id="message"
                          data-testid="rsvp-message-input"
                          placeholder="Escribe un mensaje de felicitación..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={!response || submitting}
                    data-testid="submit-rsvp-btn"
                    className="w-full btn-primary text-lg h-14"
                  >
                    {submitting ? "Enviando..." : "Confirmar RSVP"}
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
      </motion.div>
    </div>
  );
}
