import React, { useState } from 'react';
import { 
  Star, 
  MessageSquare, 
  Camera, 
  Heart, 
  MapPin, 
  Clock, 
  User,
  Send,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SatisfactionSurveyProps {
  tourId: string;
  tourName: string;
  tourDate: string;
  guideName: string;
  onClose: () => void;
}

export function SatisfactionSurvey({ 
  tourId, 
  tourName, 
  tourDate, 
  guideName, 
  onClose 
}: SatisfactionSurveyProps) {
  const [step, setStep] = useState(1);
  const [ratings, setRatings] = useState({
    overall: 0,
    guide: 0,
    organization: 0,
    safety: 0,
    value: 0
  });
  const [feedback, setFeedback] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const tourImage = 'https://images.unsplash.com/photo-1538422314488-83e8e11d298c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWtpbmclMjB0cmFpbCUyMGZvcmVzdHxlbnwxfHx8fDE3NTY5NjQ4NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';

  const highlightOptions = [
    'Paisajes espectaculares',
    'Excelente guía',
    'Buena organización',
    'Grupo agradable',
    'Comida deliciosa',
    'Actividades emocionantes',
    'Fotografías increíbles',
    'Aprendí mucho'
  ];

  const handleRating = (category: keyof typeof ratings, rating: number) => {
    setRatings(prev => ({ ...prev, [category]: rating }));
  };

  const toggleHighlight = (highlight: string) => {
    setHighlights(prev => 
      prev.includes(highlight)
        ? prev.filter(h => h !== highlight)
        : [...prev, highlight]
    );
  };

  const handleSubmit = () => {
    // Simulate survey submission
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  const renderStars = (category: keyof typeof ratings) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleRating(category, star)}
          className="focus:outline-none transition-colors"
        >
          <Star 
            className={`w-8 h-8 ${
              star <= ratings[category] 
                ? 'text-yellow-500 fill-current' 
                : 'text-gray-300 hover:text-yellow-400'
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">¡Gracias por tu opinión!</h2>
            <p className="text-muted-foreground mb-4">
              Tu evaluación nos ayuda a mejorar nuestros tours y brindar mejores experiencias.
            </p>
            <Badge className="bg-green-100 text-green-800">
              Encuesta enviada exitosamente
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Evaluación de Experiencia</CardTitle>
              <p className="text-muted-foreground">Ayúdanos a mejorar calificando tu tour</p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Tour Info */}
          <div className="flex items-center space-x-4 mb-8 p-4 bg-gray-50 rounded-lg">
            <ImageWithFallback
              src={tourImage}
              alt={tourName}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{tourName}</h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{tourDate}</span>
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  <span>Guía: {guideName}</span>
                </div>
              </div>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">¿Cómo calificarías tu experiencia?</h3>
                <p className="text-muted-foreground">Ayúdanos evaluando diferentes aspectos del tour</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Experiencia General</h4>
                    <p className="text-sm text-muted-foreground">Calificación general del tour</p>
                  </div>
                  {renderStars('overall')}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Calidad del Guía</h4>
                    <p className="text-sm text-muted-foreground">Conocimiento, amabilidad y profesionalismo</p>
                  </div>
                  {renderStars('guide')}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Organización</h4>
                    <p className="text-sm text-muted-foreground">Puntualidad, logística y coordinación</p>
                  </div>
                  {renderStars('organization')}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Seguridad</h4>
                    <p className="text-sm text-muted-foreground">Medidas de seguridad y equipos</p>
                  </div>
                  {renderStars('safety')}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Relación Calidad-Precio</h4>
                    <p className="text-sm text-muted-foreground">Valor por el dinero invertido</p>
                  </div>
                  {renderStars('value')}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setStep(2)}
                  disabled={Object.values(ratings).some(rating => rating === 0)}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Cuéntanos más sobre tu experiencia</h3>
                <p className="text-muted-foreground">Tus comentarios nos ayudan a mejorar</p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium">¿Qué fue lo que más te gustó del tour?</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                    {highlightOptions.map((highlight) => (
                      <button
                        key={highlight}
                        onClick={() => toggleHighlight(highlight)}
                        className={`p-3 rounded-lg border text-sm transition-colors ${
                          highlights.includes(highlight)
                            ? 'bg-green-100 border-green-300 text-green-800'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {highlight}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="feedback" className="text-base font-medium">
                    Comentarios adicionales (opcional)
                  </Label>
                  <Textarea
                    id="feedback"
                    placeholder="Comparte cualquier detalle específico sobre tu experiencia, sugerencias de mejora, o algo que quieras que sepamos..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="mt-2 min-h-[120px]"
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">¿Recomendarías este tour?</Label>
                  <RadioGroup value={recommendation} onValueChange={setRecommendation} className="mt-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="definitely" id="definitely" />
                      <Label htmlFor="definitely">Definitivamente sí</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="probably" id="probably" />
                      <Label htmlFor="probably">Probablemente sí</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="maybe" id="maybe" />
                      <Label htmlFor="maybe">Tal vez</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="no" />
                      <Label htmlFor="no">Probablemente no</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Anterior
                </Button>
                <div className="flex space-x-4">
                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleSubmit}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Evaluación
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}